/**
 * Source unique de vérité pour l'identité du site.
 *
 * Tout ce qui est répété ailleurs (métadonnées, Open Graph, sitemap, pied de
 * page, corpus RAG) doit venir d'ici. Une chaîne dupliquée est une chaîne qui
 * finira désynchronisée.
 */

import type { Bilingue, Langue } from "./langue.ts";

/**
 * Origine du site, pour les URL canoniques, Open Graph et le sitemap.
 *
 * Résolue dans cet ordre :
 *
 *  1. `NEXT_PUBLIC_SITE_URL` — à renseigner le jour où un vrai domaine existe.
 *     C'est la seule valeur qui vaille pour la production.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — fournie par Vercel au build, sans
 *     protocole. Donne le domaine de production du projet, y compris depuis
 *     une préproduction : c'est bien ce qu'on veut dans un canonical, sinon
 *     chaque déploiement de test se déclarerait comme l'original.
 *  3. `localhost` en dernier recours.
 *
 * **Pas de domaine codé en dur.** Écrire ici un domaine qui n'est pas encore
 * acheté ferait pointer tous les canoniques et toutes les vignettes de partage
 * vers du vide — ou vers ce que quelqu'un d'autre y mettra un jour.
 */
function resoudreOrigine(): string {
  const explicite = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicite) return explicite;

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resoudreOrigine().replace(/\/$/, "");

/**
 * **Anonymisation.** Les travaux menés en alternance sont présentés sans nommer
 * l'organisme, ses instituts, ses sites, ni les modèles de prospective sur
 * lesquels ils reposent. Cette constante est le seul endroit où la formulation
 * est décidée — ne jamais écrire le nom réel ailleurs dans le dépôt.
 *
 * Un test de build (`npm run verifier:anonymat`) échoue si un terme interdit
 * réapparaît dans le contenu.
 */
export const EMPLOYEUR = {
  libelle: { fr: "un institut de recherche public", en: "a public research institute" },
  libelleCourt: { fr: "institut de recherche public", en: "public research institute" },
  /** Utilisé quand la phrase exige une majuscule initiale. */
  libelleCapitalise: {
    fr: "Un institut de recherche public",
    en: "A public research institute",
  },
} as const satisfies Record<string, Bilingue>;

export const SITE = {
  nom: "Esteban Beretti-Prenant",
  /** Nom court, pour les contextes où le composé casse la mise en page. */
  nomCourt: "Esteban B.-P.",
  fonction: { fr: "Data scientist · AI engineer", en: "Data scientist · AI engineer" },

  /**
   * Ligne d'orientation, au-dessus du titre.
   *
   * Un recruteur doit savoir en une seconde qui parle et à quel stade il en
   * est. Le titre, lui, a le droit d'être une phrase d'auteur.
   */
  surTitre: {
    fr: "Data scientist · En alternance dans un institut de recherche public",
    en: "Data scientist · Apprentice at a public research institute",
  },

  /**
   * La proposition en une phrase. Elle porte tout le site : si elle change, la
   * hiérarchie du contenu change avec elle.
   *
   * La version précédente, « Je porte des modèles de prospective dans le
   * navigateur », décrivait une mission plutôt qu'une personne : elle enfermait
   * le site dans les six mois d'alternance qui l'ont produit, et n'aurait plus
   * rien annoncé le jour où le sujet change. Celle-ci est reprise de la
   * dernière phrase du récit — c'est le fil qui relie les sciences cognitives
   * aux données, et il tient quel que soit le domaine suivant.
   */
  accroche: {
    fr: "Je rends manipulable ce qui sert à décider.",
    /*
     * « Manipulable » n'a pas d'équivalent court en anglais. Le détour par les
     * mains garde l'idée exacte — quelque chose qu'on peut prendre et tourner —
     * et tient en quatre lignes de titre au lieu de cinq, ce que la première
     * version (« usable by anyone ») ne faisait pas.
     */
    en: "I put decision models in anyone's hands.",
  },

  /**
   * Le chiffre fait le travail que l'adjectif ne fera jamais. 0,00002 % est
   * l'écart constaté entre le portage JavaScript et le classeur d'origine,
   * mesuré automatiquement à chaque génération des données.
   *
   * La forme décimale change de séparateur selon la langue : « 0,00002 % » se
   * lit comme un séparateur de milliers pour un anglophone, ce qui abîmerait
   * précisément le chiffre le plus important du site.
   */
  sousTitre: {
    fr: "Data scientist. Je porte des modèles de prospective d'Excel vers le navigateur, je construis les pipelines qui les alimentent, et je vérifie chaque portage contre l'original. Écart constaté : 0,00002 %.",
    en: "Data scientist. I port foresight models out of Excel and into the browser, build the pipelines that feed them, and check every port against the original. Measured drift: 0.00002%.",
  },

  description: {
    fr: "Portfolio d'Esteban Beretti-Prenant : ingénierie de la donnée, portage de modèles de prospective vers le web, applications d'analyse sans serveur (DuckDB-WASM, Parquet) et systèmes de recherche augmentée.",
    en: "Esteban Beretti-Prenant's portfolio: data engineering, foresight models ported to the web, serverless analytics applications (DuckDB-WASM, Parquet) and retrieval-augmented search systems.",
  },
} as const;

/**
 * Coordonnées publiques.
 *
 * Le CV porte une adresse postale et un numéro de téléphone : **ils ne sont
 * volontairement pas repris ici**. Un portfolio est indexé, aspiré et archivé ;
 * une adresse personnelle y devient permanente et incontrôlable. Le courriel
 * suffit à être joint, et se change en cas d'abus.
 */
export const CONTACT = {
  email: "esteban.beretti@gmail.com",
  github: "https://github.com/Este34",
  /** À renseigner : Esteban doit fournir l'URL exacte. */
  linkedin: null as string | null,
} as const;

export type NavItem = {
  /** Chemin sans préfixe de langue : `lien()` s'en charge à l'affichage. */
  href: string;
  label: Bilingue;
  description: Bilingue;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/travaux",
    label: { fr: "Travaux", en: "Work" },
    description: {
      fr: "Simulateurs de prospective, pipelines de données, systèmes de recherche",
      en: "Foresight simulators, data pipelines, retrieval systems",
    },
  },
  {
    href: "/demonstration",
    label: { fr: "Démonstration", en: "Demo" },
    description: {
      fr: "Un de mes simulateurs de prospective, jouable, en données fabriquées",
      en: "One of my foresight simulators, playable, on fabricated data",
    },
  },
  {
    href: "/bac-a-sable",
    label: { fr: "Bac à sable", en: "Sandbox" },
    description: {
      fr: "Déposez vos données, interrogez-les en SQL dans votre navigateur",
      en: "Drop in your own data and query it in SQL, inside your browser",
    },
  },
  {
    href: "/labo",
    label: { fr: "Labo", en: "Lab" },
    description: {
      fr: "Simulations interactives : comportements émergents, clustering, systèmes temps réel",
      en: "Interactive simulations: emergent behaviour, clustering, real-time systems",
    },
  },
  {
    href: "/notes",
    label: { fr: "Notes", en: "Notes" },
    description: {
      fr: "Notes techniques sur le portage de modèles et la vérification",
      en: "Technical notes on model porting and verification",
    },
  },
  {
    href: "/methode",
    label: { fr: "Méthode", en: "Method" },
    description: {
      fr: "Comment je travaille avec des agents de code, et ce que je ne leur délègue pas",
      en: "How I work with coding agents, and what I never hand over",
    },
  },
  {
    href: "/parcours",
    label: { fr: "Parcours", en: "Background" },
    description: { fr: "Formation, alternance, compétences", en: "Education, apprenticeship, skills" },
  },
  {
    href: "/contact",
    label: { fr: "Contact", en: "Contact" },
    description: { fr: "Pour en parler", en: "To talk it over" },
  },
] as const;

/** Sections hors navigation principale — atteignables, non affichées. */
export const NAV_DISCRETE = [
  { href: "/making-of", label: { fr: "Making-of", en: "Making-of" } },
  { href: "/evaluations", label: { fr: "Évaluations", en: "Evaluations" } },
] as const;

/**
 * Portrait.
 *
 * Pour l'activer : déposer l'image dans `public/` et renseigner son chemin
 * ici. Tant que la valeur est `null`, le bandeau d'accueil se replie
 * proprement sur sa mise en page sans photo — aucune image cassée, aucun trou.
 *
 * Format conseillé : JPEG ou WebP, cadrage buste, au moins 800 px de large.
 * Le traitement bichrome est appliqué en CSS, donc une photo brute suffit —
 * inutile de la retoucher.
 */
export const PORTRAIT: { src: string; alt: Bilingue } | null = {
  src: "/portrait.jpg",
  alt: {
    fr: "Portrait d'Esteban Beretti-Prenant",
    en: "Portrait of Esteban Beretti-Prenant",
  },
};

/** Titre complet d'une page, tel qu'il apparaît dans l'onglet. */
export function titreParDefaut(langue: Langue): string {
  return `${SITE.nom} — ${SITE.fonction[langue]}`;
}
