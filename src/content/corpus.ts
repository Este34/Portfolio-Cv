// Import relatif volontaire : voir la note dans `travaux.ts`.
import { TRAVAUX } from "./travaux.ts";
import { COMPETENCES, EXPERIENCES, FORMATION } from "./parcours.ts";
import { SITE } from "../lib/site.ts";

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
 */

export type Passage = {
  id: string;
  texte: string;
  source: string;
  href: string;
  /** Sert à pondérer : un résumé vaut mieux qu'un détail à pertinence égale. */
  poids: number;
};

export function construireCorpus(): Passage[] {
  const passages: Passage[] = [];
  const ajouter = (id: string, texte: string, source: string, href: string, poids = 1) => {
    passages.push({ id, texte: texte.trim(), source, href, poids });
  };

  ajouter(
    "identite",
    `${SITE.nom} est ${SITE.fonction.toLowerCase()}. ${SITE.accroche} ${SITE.sousTitre}`,
    "Présentation",
    "/",
    1.3,
  );

  for (const t of TRAVAUX) {
    const href = `/travaux/${t.slug}`;

    ajouter(`${t.slug}-resume`, `${t.titre} — ${t.sousTitre}. ${t.resume}`, t.titre, href, 1.25);

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
      `${t.slug}-domaines`,
      `${t.titre} relève de ces domaines : ${t.domaines.join(", ")}.`,
      t.titre,
      href,
      1.15,
    );
    ajouter(`${t.slug}-contexte`, `${t.titre}. Contexte : ${t.contexte}`, t.titre, href);
    ajouter(
      `${t.slug}-role`,
      `Sur le projet « ${t.titre} » (${t.annee}), mon rôle : ${t.role}. Technologies employées : ${t.stack.join(", ")}.`,
      t.titre,
      href,
      1.1,
    );
    ajouter(
      `${t.slug}-contraintes`,
      `Contraintes du projet « ${t.titre} » : ${t.contraintes.join(" ")}`,
      t.titre,
      href,
    );

    for (const [i, d] of t.decisions.entries()) {
      ajouter(
        `${t.slug}-decision-${i}`,
        `Décision technique sur « ${t.titre} » : ${d.choix}. Raison : ${d.raison}`,
        t.titre,
        href,
      );
    }

    ajouter(
      `${t.slug}-resultats`,
      `Résultats du projet « ${t.titre} » : ${t.resultats.join(" ")}`,
      t.titre,
      href,
    );

    if (t.chiffres.length > 0) {
      ajouter(
        `${t.slug}-chiffres`,
        `Chiffres clés de « ${t.titre} » : ${t.chiffres
          .map((c) => `${c.valeur} — ${c.libelle}${c.note ? ` (${c.note})` : ""}`)
          .join(" ; ")}`,
        t.titre,
        href,
      );
    }
  }

  for (const e of [...EXPERIENCES, ...FORMATION].filter((x) => !x.aCompleter)) {
    ajouter(
      `parcours-${e.titre.slice(0, 24)}`,
      `${e.periode} — ${e.titre}, ${e.lieu}. ${e.description}`,
      "Parcours",
      "/parcours",
      1.1,
    );
  }

  for (const g of COMPETENCES) {
    ajouter(
      `competences-${g.famille}`,
      `Compétences en ${g.famille.toLowerCase()} : ${g.items.join(", ")}.`,
      "Parcours",
      "/parcours",
    );
  }

  ajouter(
    "methode-delegation",
    "Méthode de travail avec des agents de code. Je délègue le volume et la répétition : porter un grand tableau dans une structure de données, écrire le énième composant sur le même patron, dérouler un refactor mécanique. Ce sont des tâches où l'erreur est visible et la vérification peu coûteuse.",
    "Méthode",
    "/methode",
  );
  ajouter(
    "methode-garde",
    "Ce que je ne délègue jamais à un agent : la définition de ce qui est juste, le choix des invariants à vérifier, les arbitrages dictés par le terrain, et la relecture de ce qui part en production. Je ne valide pas un diff que je ne saurais pas défendre.",
    "Méthode",
    "/methode",
  );
  ajouter(
    "methode-verification",
    "La question posée à un agent n'est jamais « est-ce que ça marche ? » mais « comment saurai-je que ça a cessé de marcher ? ». Sur les simulateurs, la réponse est un générateur qui rejoue les trajectoires de référence et refuse de produire les données au-delà de 0,1 % d'écart avec le classeur d'origine.",
    "Méthode",
    "/methode",
  );

  ajouter(
    "labo",
    "Le labo réunit des simulations interactives écrites en canvas, sans bibliothèque : une nuée où un comportement collectif émerge de trois règles locales, une démonstration de k-moyennes qui montre la convergence itération par itération, et un jeu de type agar jouable.",
    "Labo",
    "/labo",
  );

  return passages;
}
