import { NextResponse } from "next/server";

import { MAX_QUESTION, MAX_TOURS, OUTILS, type NomOutil } from "@/lib/agent-types";
import { cibles } from "@/lib/cibles";
import { SCHEMA_TEXTE } from "@/lib/duckdb-types";
import { estLangue, type Langue } from "@/lib/langue";

/**
 * Décide du prochain outil de l'agent. Un tour, rien de plus.
 *
 * ## Le modèle décide, le navigateur agit
 *
 * Cette route ne touche ni la base ni le corpus. DuckDB tourne dans l'onglet du
 * visiteur, les vecteurs aussi, et la navigation est un changement de route
 * côté client. Le serveur reçoit la question et le résumé des observations
 * déjà faites, et renvoie **un choix d'outil**. Rien d'autre ne circule, et
 * surtout pas les données du site : elles sont déjà chez le visiteur.
 *
 * Ce partage n'est pas une élégance gratuite. Il permet à la démonstration de
 * garder exactement la même exécution dans les deux régimes : seul le décideur
 * change, les outils sont les mêmes objets.
 *
 * ## Elle est facultative
 *
 * Sans clé, en panne, ou au-delà du débit, elle répond par une erreur explicite
 * et le client repart avec son planificateur déterministe, qui tourne
 * entièrement dans le navigateur. Le panneau affiche alors lequel a servi. Une
 * démonstration qui meurt quand un quota est atteint ne démontre rien.
 */

const MODELE = "claude-haiku-4-5-20251001";

/*
 * Limitation de débit, en mémoire, et volontairement plus serrée que celle de
 * `/api/rediger` : une question rédigée coûte un appel, une tâche d'agent en
 * coûte jusqu'à cinq.
 */
const FENETRE_MS = 60_000;
const MAX_PAR_FENETRE = 12;
const compteurs = new Map<string, { n: number; debut: number }>();

function debitDepasse(cle: string): boolean {
  const maintenant = Date.now();
  const entree = compteurs.get(cle);

  if (!entree || maintenant - entree.debut > FENETRE_MS) {
    compteurs.set(cle, { n: 1, debut: maintenant });
    if (compteurs.size > 500) {
      for (const [k, v] of compteurs) {
        if (maintenant - v.debut > FENETRE_MS) compteurs.delete(k);
      }
    }
    return false;
  }

  entree.n++;
  return entree.n > MAX_PAR_FENETRE;
}

const OUTILS_MODELE = [
  {
    name: "chercher",
    description:
      "Recherche sémantique dans le corpus du site : la prose des pages, des études de cas et des notes. À utiliser pour toute question sur le raisonnement, la méthode ou le parcours. Renvoie des passages cités avec leur source.",
    input_schema: {
      type: "object" as const,
      properties: { argument: { type: "string", description: "La question, en langue naturelle." } },
      required: ["argument"],
    },
  },
  {
    name: "sql",
    description: `Exécute une requête DuckDB en lecture seule sur les tables du portfolio. À utiliser pour compter, classer, filtrer, croiser. Schéma :\n${SCHEMA_TEXTE}`,
    input_schema: {
      type: "object" as const,
      properties: {
        argument: { type: "string", description: "Une requête SELECT ou WITH, sans point-virgule." },
      },
      required: ["argument"],
    },
  },
  {
    name: "naviguer",
    description:
      "Ouvre une page du site derrière le panneau. L'argument doit être le chemin exact ou le titre exact d'une des pages listées dans les consignes. Toute autre valeur est refusée.",
    input_schema: {
      type: "object" as const,
      properties: { argument: { type: "string", description: "Chemin ou titre exact de la page." } },
      required: ["argument"],
    },
  },
  {
    name: "repondre",
    description:
      "Termine la tâche en donnant la réponse finale au visiteur. À n'appeler que lorsque les observations suffisent à répondre.",
    input_schema: {
      type: "object" as const,
      properties: { argument: { type: "string", description: "La réponse, deux à quatre phrases." } },
      required: ["argument"],
    },
  },
];

function consignes(langue: Langue, tours: number): string {
  const pages = cibles(langue)
    .map((c) => `- ${c.href} — ${c.label}`)
    .join("\n");

  const commun = `Pages ouvrables :\n${pages}\n\nSchéma SQL :\n${SCHEMA_TEXTE}`;

  if (langue === "fr") {
    return (
      "Tu es l'agent de la console du portfolio d'Esteban Beretti-Prenant. Tu disposes de quatre outils et tu dois en appeler exactement un à chaque tour.\n\n" +
      "Règles strictes :\n" +
      "- N'affirme aucun fait qui ne vienne pas d'une observation déjà faite. Aucune connaissance extérieure.\n" +
      "- Ne navigue que vers une page de la liste ci-dessous, par son chemin exact.\n" +
      `- Il te reste ${tours} tour${tours > 1 ? "s" : ""}. Appelle « repondre » avant de les épuiser.\n` +
      "- Si les observations ne permettent pas de répondre, dis-le dans « repondre » plutôt que d'inventer.\n" +
      "- Réponds en français, à la troisième personne, en deux à quatre phrases.\n\n" +
      commun
    );
  }

  return (
    "You are the console agent of Esteban Beretti-Prenant's portfolio. You have four tools and must call exactly one per turn.\n\n" +
    "Strict rules:\n" +
    "- State no fact that does not come from an observation already made. No outside knowledge.\n" +
    "- Navigate only to a page from the list below, by its exact path.\n" +
    `- You have ${tours} turn${tours > 1 ? "s" : ""} left. Call «repondre» before running out.\n` +
    "- If the observations do not allow an answer, say so in «repondre» rather than inventing one.\n" +
    "- Answer in English, in the third person, in two to four sentences.\n\n" +
    commun
  );
}

type EtapeRecue = { outil: string; argument: string; observation: string };

function lireTrace(brut: unknown): EtapeRecue[] | null {
  if (!Array.isArray(brut)) return null;
  if (brut.length > MAX_TOURS) return null;

  const trace: EtapeRecue[] = [];
  for (const e of brut) {
    if (typeof e !== "object" || e === null) return null;
    const { outil, argument, observation } = e as Record<string, unknown>;
    if (typeof outil !== "string" || !(OUTILS as readonly string[]).includes(outil)) return null;
    if (typeof argument !== "string" || typeof observation !== "string") return null;
    trace.push({
      outil,
      argument: argument.slice(0, 600),
      // Une observation est tronquée ici et pas seulement côté client : le
      // client peut mentir, et une table de dix mille lignes recopiée dans le
      // contexte serait payée par le propriétaire de la clé.
      observation: observation.slice(0, 3000),
    });
  }
  return trace;
}

export async function POST(requete: Request) {
  const cle = process.env.ANTHROPIC_API_KEY;
  /*
   * Pas de clé : ce n'est pas une erreur, c'est le mode par défaut.
   *
   * Répondre 503 serait techniquement juste et pratiquement mauvais : le
   * navigateur inscrirait une ligne rouge dans la console de tout visiteur qui
   * ouvre l'agent sur un déploiement sans clé, pour une situation entièrement
   * prévue. `/api/rediger` avait déjà tranché de la même façon.
   */
  if (!cle) return NextResponse.json({ disponible: false }, { status: 200 });

  const ip = requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
  if (debitDepasse(ip)) return NextResponse.json({ motif: "débit" }, { status: 429 });

  let corps: Record<string, unknown>;
  try {
    corps = (await requete.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ motif: "corps illisible" }, { status: 400 });
  }

  const { langue, question } = corps;
  if (typeof langue !== "string" || !estLangue(langue)) {
    return NextResponse.json({ motif: "langue invalide" }, { status: 400 });
  }
  if (typeof question !== "string" || question.trim() === "") {
    return NextResponse.json({ motif: "requête invalide" }, { status: 400 });
  }

  const trace = lireTrace(corps.trace ?? []);
  if (!trace) return NextResponse.json({ motif: "trace invalide" }, { status: 400 });

  const restants = Math.max(1, MAX_TOURS - trace.length);

  const conversation = [
    langue === "fr" ? `Tâche du visiteur : ${question.slice(0, MAX_QUESTION)}` : `Visitor task: ${question.slice(0, MAX_QUESTION)}`,
    ...trace.map(
      (e, i) => `Tour ${i + 1} — outil « ${e.outil} » avec « ${e.argument} »\nObservation :\n${e.observation}`,
    ),
  ].join("\n\n");

  try {
    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 700,
        system: consignes(langue, restants),
        tools: OUTILS_MODELE,
        // `any` force un appel d'outil : sans cela le modèle rendrait parfois
        // du texte libre, que la boucle ne saurait pas exécuter.
        tool_choice: restants <= 1 ? { type: "tool", name: "repondre" } : { type: "any" },
        messages: [{ role: "user", content: conversation }],
      }),
    });

    if (!reponse.ok) {
      return NextResponse.json({ motif: "amont indisponible" }, { status: 502 });
    }

    const donnees = (await reponse.json()) as {
      content?: { type: string; name?: string; input?: Record<string, unknown> }[];
    };
    const appel = donnees.content?.find((b) => b.type === "tool_use");

    if (!appel?.name || !(OUTILS as readonly string[]).includes(appel.name)) {
      return NextResponse.json({ motif: "outil inconnu" }, { status: 502 });
    }
    const argument = appel.input?.argument;
    if (typeof argument !== "string" || argument.trim() === "") {
      return NextResponse.json({ motif: "argument manquant" }, { status: 502 });
    }

    return NextResponse.json({ outil: appel.name as NomOutil, argument });
  } catch {
    return NextResponse.json({ motif: "amont injoignable" }, { status: 502 });
  }
}
