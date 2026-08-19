/**
 * L'agent : la boucle qui manquait à la console.
 *
 * La palette offrait déjà trois choses : aller à une page, écrire du SQL, poser
 * une question au corpus vectorisé. Trois outils, actionnés à la main, un à la
 * fois. L'agent n'en reçoit aucun quatrième. Il reçoit **une boucle** :
 *
 *     décider → appeler un outil → observer le résultat → décider à nouveau
 *
 * C'est tout l'écart entre une console et un agent, et c'est ce que la trace
 * affichée à l'écran donne à voir. La page change réellement sous le panneau
 * quand il décide de naviguer.
 *
 * ## Deux régimes, et le repli est le défaut
 *
 * Le **planificateur déterministe** tourne entièrement dans le navigateur, sans
 * clé, sans réseau, sans coût. Il reconnaît une grammaire d'intentions figée et
 * en déduit un plan. Il fait moins de choses que le modèle, il ne comprend pas
 * une tournure qu'on n'a pas prévue, et il ne ment jamais sur ce qu'il a fait.
 *
 * Le régime **modèle** appelle une route serveur qui, elle, appelle Claude en
 * mode outils. Il comprend des formulations libres, et il coûte de l'argent.
 *
 * Le repli est automatique et silencieux : si la route est absente, sans clé,
 * en panne ou saturée, la boucle repart avec le planificateur déterministe et
 * le panneau affiche lequel a servi. Une démonstration qui meurt quand un quota
 * est atteint est une démonstration qui ne démontre rien.
 *
 * ## Ce qui décide n'est pas ce qui agit
 *
 * Même en régime modèle, **les outils s'exécutent dans le navigateur**. DuckDB
 * interroge une base locale, le corpus est vectorisé sur la machine du
 * visiteur, la navigation est un changement de route côté client. Le serveur ne
 * reçoit que la question et les observations dont le modèle a besoin pour
 * décider du tour suivant, et ne renvoie qu'un choix d'outil.
 *
 * ## Ce module ne rend rien
 *
 * Comme `mlp.ts` et `renforcement.ts`. Les outils sont **injectés**, ce qui
 * permet de vérifier en Node que la boucle termine, qu'elle respecte son
 * plafond de tours, et qu'elle refuse une navigation hors du site — trois
 * propriétés qu'aucune inspection visuelle ne garantit.
 */

import { TRAVAUX } from "@/content/travaux";

import {
  MAX_QUESTION,
  MAX_TOURS,
  type Action,
  type Etape,
  type EtatAgent,
  type NomOutil,
  type Observation,
  type Regime,
  type Resultat,
} from "./agent-types";
import { cibles, resoudreCible, type Cible } from "./cibles";
import type { ResultatRequete } from "./duckdb-types";
import type { Langue } from "./langue";
import type { Extrait } from "./rag-types";

/* -------------------------------------------------------------------------- */
/* Les outils                                                                  */
/* -------------------------------------------------------------------------- */

export type Outillage = {
  chercher: (question: string) => Promise<Extrait[]>;
  sql: (requete: string) => Promise<ResultatRequete>;
  naviguer: (cible: Cible) => Promise<void>;
};

export type Contexte = {
  question: string;
  langue: Langue;
  etapes: readonly Etape[];
};

export type Decideur = (c: Contexte) => Promise<Action>;

/* -------------------------------------------------------------------------- */
/* La boucle                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Seules les requêtes de lecture sont exécutées.
 *
 * La base est locale, en mémoire, reconstruite à chaque ouverture d'onglet :
 * un `DROP TABLE` n'y détruirait rien de durable. La garde n'est donc pas là
 * pour protéger des données, elle est là parce qu'un agent qui peut écrire
 * finit par écrire, et qu'une trace où il modifie ce qu'il est en train de
 * mesurer ne veut plus rien dire.
 */
export function requeteDeLecture(sql: string): boolean {
  const nettoye = sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .trim()
    .toLowerCase();
  if (!nettoye) return false;
  if (nettoye.includes(";") && !/;\s*$/.test(nettoye)) return false;
  return /^(select|with|pragma|describe|show)\b/.test(nettoye);
}

async function executerOutil(
  action: Action,
  outillage: Outillage,
  langue: Langue,
): Promise<Observation> {
  switch (action.outil) {
    case "chercher": {
      const extraits = await outillage.chercher(action.argument.slice(0, MAX_QUESTION));
      return { type: "extraits", extraits };
    }
    case "sql": {
      if (!requeteDeLecture(action.argument)) {
        return { type: "erreur", message: "requête refusée : lecture seule" };
      }
      return { type: "table", resultat: await outillage.sql(action.argument) };
    }
    case "naviguer": {
      const cible = resoudreCible(action.argument, langue);
      /*
       * Une cible inconnue est une observation, pas une exception.
       *
       * Le tour suivant la voit dans la trace et peut corriger. Lever ici
       * arrêterait la boucle sur ce qui est, du point de vue de l'agent, un
       * simple retour d'outil négatif.
       */
      if (!cible) return { type: "erreur", message: `page inconnue : ${action.argument}` };
      await outillage.naviguer(cible);
      return { type: "page", href: cible.href, label: cible.label };
    }
    case "repondre":
      return { type: "texte", texte: action.argument };
  }
}

export async function executerAgent(opts: {
  question: string;
  langue: Langue;
  outillage: Outillage;
  decider: Decideur;
  regime: Regime;
  repli?: boolean;
  maxTours?: number;
  surEtat?: (etat: EtatAgent, etapes: readonly Etape[]) => void;
}): Promise<Resultat> {
  const { question, langue, outillage, decider, regime } = opts;
  const maxTours = opts.maxTours ?? MAX_TOURS;
  const debut = performance.now();
  const etapes: Etape[] = [];

  for (let tour = 1; tour <= maxTours; tour++) {
    opts.surEtat?.("reflexion", etapes);

    let action: Action;
    try {
      action = await decider({ question, langue, etapes });
    } catch (e: unknown) {
      /*
       * Un décideur qui échoue termine la boucle sur ce qu'elle a déjà trouvé,
       * plutôt que de la faire disparaître. Les observations recueillies
       * jusque-là répondent souvent déjà.
       */
      const message = e instanceof Error ? e.message : "décision impossible";
      etapes.push({
        tour,
        action: { outil: "repondre", argument: "" },
        observation: { type: "erreur", message },
        duree: 0,
      });
      break;
    }

    opts.surEtat?.("outil", etapes);
    const t0 = performance.now();
    let observation: Observation;
    try {
      observation = await executerOutil(action, outillage, langue);
    } catch (e: unknown) {
      observation = { type: "erreur", message: e instanceof Error ? e.message : "outil en échec" };
    }

    etapes.push({ tour, action, observation, duree: performance.now() - t0 });
    if (action.outil === "repondre") break;
  }

  const derniere = etapes[etapes.length - 1];
  const reponse =
    derniere?.action.outil === "repondre" && derniere.observation.type === "texte"
      ? derniere.observation.texte
      : null;

  opts.surEtat?.(reponse === null ? "echec" : "fini", etapes);

  return {
    etapes,
    reponse,
    regime,
    repli: opts.repli ?? false,
    duree: performance.now() - debut,
  };
}

/* -------------------------------------------------------------------------- */
/* Le planificateur déterministe                                               */
/* -------------------------------------------------------------------------- */

export function normaliser(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Le vocabulaire technique est **dérivé du contenu**, pas recopié.
 *
 * Une liste écrite à la main serait juste le jour où on l'écrit. Celle-ci se
 * met à jour toute seule le jour où un projet arrive avec une bibliothèque de
 * plus, ce qui est la seule façon qu'un planificateur figé reste vrai.
 */
export const TECHNOS: readonly string[] = [
  ...new Set(TRAVAUX.flatMap((t) => t.stack)),
].sort((a, b) => b.length - a.length);

function technoCitee(question: string): string | null {
  const q = ` ${normaliser(question)} `;
  for (const techno of TECHNOS) {
    const n = normaliser(techno);
    if (n.length >= 2 && q.includes(` ${n} `)) return techno;
  }
  return null;
}

const VERBES_OUVRIR = [
  "ouvre",
  "ouvrir",
  "va a",
  "vas a",
  "montre",
  "affiche",
  "emmene",
  "amene",
  "open",
  "go to",
  "show me",
  "take me",
  "navigate",
];

const MOTS_COMBIEN = ["combien", "how many", "how much", "nombre de", "number of"];
const MOTS_SUPERLATIF = ["le plus", "la plus", "the most", "most "];

function contient(question: string, mots: readonly string[]): boolean {
  const q = normaliser(question);
  return mots.some((m) => q.includes(normaliser(m)));
}

/** La cible dont le libellé apparaît dans la question, s'il y en a une. */
function cibleCitee(question: string, langue: Langue): Cible | null {
  const q = normaliser(question);
  // Le libellé le plus long d'abord : « Travaux » ne doit pas gagner contre
  // « Pipeline Comtrade » dans « ouvre la page du pipeline Comtrade ».
  const liste = [...cibles(langue)].sort((a, b) => b.label.length - a.label.length);
  return liste.find((c) => normaliser(c.label).length >= 3 && q.includes(normaliser(c.label))) ?? null;
}

const PHRASES = {
  fr: {
    ouverture: (label: string) => `La page « ${label} » est ouverte derrière ce panneau.`,
    denombrementTechno: (n: number, techno: string) =>
      `${n} projet${n > 1 ? "s" : ""} utilise${n > 1 ? "nt" : ""} ${techno}.`,
    denombrementTravaux: (n: number) => `Le portfolio compte ${n} travaux.`,
    listeTechno: (techno: string, titres: string[]) =>
      `${techno} apparaît dans ${titres.length} projet${titres.length > 1 ? "s" : ""} : ${titres.join(", ")}.`,
    superlatif: (titre: string, n: number) =>
      `C'est « ${titre} », avec ${n} technologies déclarées.`,
    extraits: (n: number) =>
      `${n} passage${n > 1 ? "s" : ""} du site répond${n > 1 ? "ent" : ""} à cette question, cité${n > 1 ? "s" : ""} ci-dessous.`,
    rien: "Rien dans le corpus ne répond à cette question, et je préfère le dire plutôt que de citer le passage le moins hors sujet.",
    pasCompris:
      "Le planificateur déterministe ne reconnaît pas cette demande. Il suit une grammaire figée : ouvrir une page nommée, dénombrer, lister par technologie, ou chercher dans le corpus.",
  },
  en: {
    ouverture: (label: string) => `The «${label}» page is now open behind this panel.`,
    denombrementTechno: (n: number, techno: string) =>
      `${n} project${n > 1 ? "s" : ""} use${n > 1 ? "" : "s"} ${techno}.`,
    denombrementTravaux: (n: number) => `The portfolio holds ${n} projects.`,
    listeTechno: (techno: string, titres: string[]) =>
      `${techno} appears in ${titres.length} project${titres.length > 1 ? "s" : ""}: ${titres.join(", ")}.`,
    superlatif: (titre: string, n: number) => `It is «${titre}», with ${n} declared technologies.`,
    extraits: (n: number) =>
      `${n} passage${n > 1 ? "s" : ""} from the site answer${n > 1 ? "" : "s"} this question, quoted below.`,
    rien: "Nothing in the corpus answers this question, and I would rather say so than quote the least off-topic passage.",
    pasCompris:
      "The deterministic planner does not recognise this request. It follows a fixed grammar: open a named page, count, list by technology, or search the corpus.",
  },
} as const;

/** Première colonne de la première ligne, en nombre. */
function premierNombre(r: ResultatRequete): number {
  const v = r.lignes[0]?.[0];
  return typeof v === "bigint" ? Number(v) : Number(v ?? 0);
}

/** Première colonne de toutes les lignes, en texte. */
function colonneTexte(r: ResultatRequete, i = 0): string[] {
  return r.lignes.map((l) => String(l[i]));
}

/**
 * Le planificateur déterministe.
 *
 * Il ne devine rien. Il reconnaît quatre intentions et applique le plan
 * correspondant, en lisant les observations déjà présentes dans la trace pour
 * savoir où il en est. C'est ce qui le rend prévisible, testable, et incapable
 * d'inventer un fait.
 */
export function planificateurDeterministe(): Decideur {
  return async ({ question, langue, etapes }) => {
    const mots = PHRASES[langue];
    const derniere = etapes[etapes.length - 1];
    const techno = technoCitee(question);
    const veutOuvrir = contient(question, VERBES_OUVRIR);

    // ---- Suites, quand un outil a déjà parlé ------------------------------
    if (derniere) {
      const obs = derniere.observation;

      if (obs.type === "page") {
        return { outil: "repondre", argument: mots.ouverture(obs.label) };
      }

      if (obs.type === "erreur") {
        return { outil: "repondre", argument: mots.pasCompris };
      }

      if (obs.type === "extraits") {
        return {
          outil: "repondre",
          argument:
            obs.extraits.length === 0 ? mots.rien : mots.extraits(obs.extraits.length),
        };
      }

      if (obs.type === "table") {
        const colonnes = derniere.observation.type === "table" ? obs.resultat.colonnes : [];

        // Superlatif suivi d'une ouverture : le seul plan à trois outils.
        if (veutOuvrir && contient(question, MOTS_SUPERLATIF)) {
          const dejaOuvert = etapes.some((e) => e.observation.type === "page");
          const titre = colonneTexte(obs.resultat)[0];
          if (titre && !dejaOuvert) return { outil: "naviguer", argument: titre };
        }

        if (contient(question, MOTS_COMBIEN)) {
          const n = premierNombre(obs.resultat);
          return {
            outil: "repondre",
            argument: techno ? mots.denombrementTechno(n, techno) : mots.denombrementTravaux(n),
          };
        }

        if (contient(question, MOTS_SUPERLATIF)) {
          const titre = colonneTexte(obs.resultat)[0] ?? "";
          const n = Number(obs.resultat.lignes[0]?.[colonnes.length - 1] ?? 0);
          return { outil: "repondre", argument: mots.superlatif(titre, n) };
        }

        if (techno) {
          return {
            outil: "repondre",
            argument: mots.listeTechno(techno, colonneTexte(obs.resultat)),
          };
        }

        return { outil: "repondre", argument: mots.extraits(obs.resultat.lignes.length) };
      }
    }

    // ---- Premier tour : le choix du plan ----------------------------------
    if (veutOuvrir && !contient(question, MOTS_SUPERLATIF)) {
      const cible = cibleCitee(question, langue);
      if (cible) return { outil: "naviguer", argument: cible.href };
    }

    if (contient(question, MOTS_COMBIEN)) {
      return {
        outil: "sql",
        argument: techno
          ? `SELECT count(DISTINCT slug) FROM stack WHERE techno = '${techno.replace(/'/g, "''")}'`
          : "SELECT count(*) FROM travaux",
      };
    }

    if (contient(question, MOTS_SUPERLATIF)) {
      return {
        outil: "sql",
        argument: "SELECT titre, nb_technos FROM travaux ORDER BY nb_technos DESC, rang LIMIT 1",
      };
    }

    if (techno) {
      return {
        outil: "sql",
        argument:
          `SELECT t.titre FROM travaux t JOIN stack s USING (slug) ` +
          `WHERE s.techno = '${techno.replace(/'/g, "''")}' ORDER BY t.rang`,
      };
    }

    return { outil: "chercher", argument: question };
  };
}

/* -------------------------------------------------------------------------- */
/* Le régime modèle                                                            */
/* -------------------------------------------------------------------------- */

/** Ce que la route serveur reçoit d'une observation : court, et déjà réduit. */
export function resumerObservation(o: Observation, langue: Langue): string {
  switch (o.type) {
    case "extraits":
      if (o.extraits.length === 0) return langue === "fr" ? "aucun passage" : "no passage";
      return o.extraits
        .slice(0, 4)
        .map((e, i) => `[${i + 1}] (${e.source}) ${e.texte.slice(0, 420)}`)
        .join("\n");
    case "table": {
      const { colonnes, lignes } = o.resultat;
      const tete = colonnes.join(" | ");
      const corps = lignes
        .slice(0, 20)
        .map((l) => l.map((v) => String(v)).join(" | "))
        .join("\n");
      return `${tete}\n${corps}${lignes.length > 20 ? `\n… ${lignes.length} lignes au total` : ""}`;
    }
    case "page":
      return `page ouverte : ${o.label} (${o.href})`;
    case "texte":
      return o.texte;
    case "erreur":
      return `erreur : ${o.message}`;
  }
}

const OUTILS_VALIDES = new Set<NomOutil>(["chercher", "sql", "naviguer", "repondre"]);

/**
 * Le décideur qui interroge la route serveur.
 *
 * Il ne fait aucune confiance à ce qu'il reçoit : un nom d'outil hors des
 * quatre, un argument absent ou une réponse illisible lèvent, ce qui fait
 * basculer l'appelant sur le planificateur déterministe. Un agent qui exécute
 * ce qu'un modèle a écrit sans le valider n'est pas un agent, c'est une porte.
 */
export function planificateurModele(): Decideur {
  return async ({ question, langue, etapes }) => {
    const reponse = await fetch("/api/agent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        langue,
        question: question.slice(0, MAX_QUESTION),
        trace: etapes.map((e) => ({
          outil: e.action.outil,
          argument: e.action.argument,
          observation: resumerObservation(e.observation, langue),
        })),
      }),
    });

    if (!reponse.ok) throw new Error(`route agent : ${reponse.status}`);

    const donnees: unknown = await reponse.json();
    if (typeof donnees !== "object" || donnees === null) throw new Error("réponse illisible");

    const { outil, argument, raison, disponible } = donnees as Record<string, unknown>;
    // Un déploiement sans clé répond 200 avec ce drapeau, pour ne pas inscrire
    // une erreur rouge dans la console de chaque visiteur.
    if (disponible === false) throw new Error("modèle non configuré");
    if (typeof outil !== "string" || !OUTILS_VALIDES.has(outil as NomOutil)) {
      throw new Error(`outil inconnu : ${String(outil)}`);
    }
    if (typeof argument !== "string" || argument.trim() === "") {
      throw new Error("argument manquant");
    }

    return {
      outil: outil as NomOutil,
      argument,
      raison: typeof raison === "string" ? raison : undefined,
    };
  };
}

/* -------------------------------------------------------------------------- */
/* Le repli                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Mémoire de session : une fois la route connue absente, on cesse d'appeler.
 *
 * Sans elle, chaque tâche lancée sur un déploiement sans clé commencerait par
 * un aller-retour réseau voué à échouer. Une fois suffit à l'apprendre.
 */
let modeleDisponible: boolean | null = null;

/** Remet la mémoire à zéro. Réservé aux tests. */
export function oublierDisponibilite(): void {
  modeleDisponible = null;
}

/**
 * Le décideur des deux régimes, avec bascule irréversible.
 *
 * Il tente le modèle, et au premier échec passe définitivement au
 * planificateur déterministe **sans interrompre la boucle en cours**. C'est
 * possible parce que le planificateur déterministe lit la trace au lieu de
 * tenir son propre état : il reprend une partie commencée par un autre.
 *
 * La bascule est irréversible dans un même run, délibérément. Réessayer le
 * modèle à chaque tour après une panne multiplierait les délais d'attente au
 * moment précis où le visiteur regarde.
 */
export function decideurAvecRepli(): {
  decider: Decideur;
  bilan: () => { regime: Regime; repli: boolean };
} {
  const modele = planificateurModele();
  const deterministe = planificateurDeterministe();
  let bascule = modeleDisponible === false;
  let modeleAServi = false;

  return {
    decider: async (c) => {
      if (!bascule) {
        try {
          const action = await modele(c);
          modeleDisponible = true;
          modeleAServi = true;
          return action;
        } catch {
          bascule = true;
          modeleDisponible = false;
        }
      }
      return deterministe(c);
    },
    bilan: () => ({
      regime: modeleAServi ? "modele" : "deterministe",
      // Un repli n'est signalé que s'il a coupé une exécution en cours : sur un
      // déploiement sans clé, le planificateur déterministe n'est pas un pis-aller,
      // c'est le mode normal, et l'annoncer comme une panne serait faux.
      repli: modeleAServi && bascule,
    }),
  };
}
