// Import relatif volontaire : voir la note dans `travaux.ts`.
import { lien, t, ts, type Langue } from "../lib/langue.ts";
import { SITE } from "../lib/site.ts";
import { PAGE_LABO, PAGE_METHODE, PAGE_NOTES } from "./pages.ts";
import { COMPETENCES, EXPERIENCES, FORMATION } from "./parcours.ts";
import { NOTES, texteDeNote } from "./notes.ts";
import { TRAVAUX } from "./travaux.ts";

/**
 * Corpus du moteur de recherche.
 *
 * Chaque passage est une unité de réponse : assez court pour être cité tel
 * quel, assez long pour se suffire hors contexte. Découper plus fin
 * améliorerait le rappel mais produirait des réponses tronquées ; découper
 * plus gros noierait la phrase utile.
 *
 * Chaque passage porte sa source et son lien : une réponse sans provenance
 * vérifiable ne vaut rien sur un portfolio.
 *
 * **Un corpus par langue.** Le modèle est multilingue, donc une question
 * anglaise retrouverait à peu près les bons passages français — mais elle
 * recevrait des extraits en français, ce qui n'est pas une réponse. Deux
 * corpus, deux jeux de vecteurs, et les liens cités pointent déjà vers la
 * bonne version de la page.
 */

export type Passage = {
  id: string;
  texte: string;
  source: string;
  href: string;
  /** Sert à pondérer : un résumé vaut mieux qu'un détail à pertinence égale. */
  poids: number;
};

/** Les tournures de liaison du corpus, elles aussi traduites. */
const LIENS = {
  est: { fr: "est", en: "is" },
  domaines: {
    fr: "relève de ces domaines :",
    en: "covers these domains:",
  },
  contexte: { fr: "Contexte :", en: "Context:" },
  role: { fr: "mon rôle :", en: "my role:" },
  surLeProjet: { fr: "Sur le projet", en: "On the project" },
  technologies: { fr: "Technologies employées :", en: "Technologies used:" },
  contraintesDu: { fr: "Contraintes du projet", en: "Constraints on the project" },
  decisionSur: { fr: "Décision technique sur", en: "Technical decision on" },
  raison: { fr: "Raison :", en: "Reason:" },
  resultatsDu: { fr: "Résultats du projet", en: "Results of the project" },
  chiffresDe: { fr: "Chiffres clés de", en: "Key figures for" },
  competencesEn: { fr: "Compétences en", en: "Skills in" },
  /* Étiquettes de source, affichées sous chaque extrait cité. */
  sourcePresentation: { fr: "Présentation", en: "About" },
  sourceParcours: { fr: "Parcours", en: "Background" },
} as const;

export function construireCorpus(langue: Langue): Passage[] {
  const passages: Passage[] = [];
  const ajouter = (id: string, texte: string, source: string, href: string, poids = 1) => {
    passages.push({ id, texte: texte.trim(), source, href, poids });
  };
  const L = (cle: keyof typeof LIENS) => t(LIENS[cle], langue);

  ajouter(
    "identite",
    `${SITE.nom} ${L("est")} ${SITE.fonction[langue].toLowerCase()}. ${t(SITE.accroche, langue)} ${t(SITE.sousTitre, langue)}`,
    L("sourcePresentation"),
    lien("/", langue),
    1.3,
  );

  for (const travail of TRAVAUX) {
    const href = lien(`/travaux/${travail.slug}`, langue);
    const titre = t(travail.titre, langue);

    ajouter(
      `${travail.slug}-resume`,
      `${titre}. ${t(travail.sousTitre, langue)}. ${t(travail.resume, langue)}`,
      titre,
      href,
      1.25,
    );

    /*
     * Les domaines vivent dans un passage court et séparé, pas fondus dans le
     * résumé.
     *
     * Le problème d'origine : « a-t-il travaillé sur de l'intelligence
     * artificielle ? » ne remontait aucun projet, parce que le texte du projet
     * de recherche augmentée parle de vectorisation et de similarité cosinus,
     * jamais d'« intelligence artificielle ». Les ajouter au résumé n'a rien
     * changé — la mise en commun par moyenne dilue une expression courte dans
     * un passage long, et le signal se perd.
     *
     * Une phrase brève et dense, elle, garde tout son poids : c'est le pont
     * entre le mot que le lecteur emploie et celui qu'emploie le projet.
     */
    ajouter(
      `${travail.slug}-domaines`,
      `${titre} ${L("domaines")} ${ts(travail.domaines, langue).join(", ")}.`,
      titre,
      href,
      1.15,
    );
    ajouter(
      `${travail.slug}-contexte`,
      `${titre}. ${L("contexte")} ${t(travail.contexte, langue)}`,
      titre,
      href,
    );
    ajouter(
      `${travail.slug}-role`,
      `${L("surLeProjet")} « ${titre} » (${travail.annee}), ${L("role")} ${t(travail.role, langue)}. ${L("technologies")} ${travail.stack.join(", ")}.`,
      titre,
      href,
      1.1,
    );
    ajouter(
      `${travail.slug}-contraintes`,
      `${L("contraintesDu")} « ${titre} » : ${ts(travail.contraintes, langue).join(" ")}`,
      titre,
      href,
    );

    for (const [i, d] of travail.decisions.entries()) {
      ajouter(
        `${travail.slug}-decision-${i}`,
        `${L("decisionSur")} « ${titre} » : ${t(d.choix, langue)}. ${L("raison")} ${t(d.raison, langue)}`,
        titre,
        href,
      );
    }

    ajouter(
      `${travail.slug}-resultats`,
      `${L("resultatsDu")} « ${titre} » : ${ts(travail.resultats, langue).join(" ")}`,
      titre,
      href,
    );

    if (travail.chiffres.length > 0) {
      ajouter(
        `${travail.slug}-chiffres`,
        `${L("chiffresDe")} « ${titre} » : ${travail.chiffres
          .map(
            (c) =>
              `${t(c.valeur, langue)} ${t(c.libelle, langue)}${c.note ? ` (${t(c.note, langue)})` : ""}`,
          )
          .join(" ; ")}`,
        titre,
        href,
      );
    }
  }

  const sourceParcours = L("sourceParcours");
  for (const e of [...EXPERIENCES, ...FORMATION]) {
    ajouter(
      `parcours-${e.titre.fr.slice(0, 24)}`,
      `${t(e.periode, langue)} — ${t(e.titre, langue)}, ${t(e.lieu, langue)}. ${t(e.description, langue)}`,
      sourceParcours,
      lien("/parcours", langue),
      1.1,
    );
  }

  for (const g of COMPETENCES) {
    ajouter(
      `competences-${g.famille.fr}`,
      `${L("competencesEn")} ${t(g.famille, langue).toLowerCase()} : ${ts(g.items, langue).join(", ")}.`,
      sourceParcours,
      lien("/parcours", langue),
    );
  }

  /*
   * La méthode et le labo puisent dans le texte des pages plutôt que d'en
   * recopier une paraphrase. La version précédente recopiait, et les deux
   * formulations avaient déjà commencé à diverger.
   */
  const sourceMethode = t(PAGE_METHODE.meta.titre, langue);
  const cheminMethode = lien("/methode", langue);
  for (const bloc of PAGE_METHODE.blocs) {
    ajouter(
      `methode-${bloc.titre.fr.slice(0, 20)}`,
      `${t(bloc.titre, langue)}. ${bloc.paragraphes.map((p) => t(p, langue)).join(" ")}`,
      sourceMethode,
      cheminMethode,
    );
  }
  ajouter(
    "methode-garde",
    `${t(PAGE_METHODE.garde.titre, langue)} : ${PAGE_METHODE.garde.items
      .map((i) => `${t(i.titre, langue)}. ${t(i.corps, langue)}`)
      .join(" ")}`,
    sourceMethode,
    cheminMethode,
  );
  ajouter(
    "methode-verification",
    PAGE_METHODE.verification.paragraphes.map((p) => t(p, langue)).join(" "),
    sourceMethode,
    cheminMethode,
  );

  ajouter(
    "labo",
    `${t(PAGE_LABO.chapeau, langue)} ${[
      PAGE_LABO.demos.reseau,
      PAGE_LABO.demos.nuee,
      PAGE_LABO.demos.kmoyennes,
      PAGE_LABO.demos.agar,
    ]
      .map((d) => `${t(d.titre, langue)} : ${t(d.sousTitre, langue)}.`)
      .join(" ")}`,
    t(PAGE_LABO.meta.titre, langue),
    lien("/labo", langue),
  );

  /*
   * Les notes entrent entières dans le corpus, en un seul passage chacune.
   *
   * Les découper par section aurait amélioré le rappel sur une question très
   * précise, mais une note est un raisonnement suivi : un extrait pris au
   * milieu se cite mal, parce qu'il suppose ce qui précède. Mieux vaut un
   * passage long et un lien vers le texte complet.
   */
  for (const note of NOTES) {
    ajouter(
      `note-${note.slug}`,
      texteDeNote(note, langue),
      t(PAGE_NOTES.surTitre, langue),
      lien(`/notes/${note.slug}`, langue),
      1.2,
    );
  }

  return passages;
}
