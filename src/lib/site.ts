/**
 * Source unique de vérité pour l'identité du site.
 *
 * Tout ce qui est répété ailleurs (métadonnées, Open Graph, sitemap, pied de
 * page, corpus RAG) doit venir d'ici. Une chaîne dupliquée est une chaîne qui
 * finira désynchronisée.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://esteban-beretti.dev"
).replace(/\/$/, "");

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
  libelle: "un institut de recherche public",
  libelleCourt: "institut de recherche public",
  /** Utilisé quand la phrase exige une majuscule initiale. */
  libelleCapitalise: "Un institut de recherche public",
} as const;

export const SITE = {
  nom: "Esteban Beretti-Prenant",
  /** Nom court, pour les contextes où le composé casse la mise en page. */
  nomCourt: "Esteban B.-P.",
  fonction: "Data scientist · AI engineer",
  langue: "fr-FR",

  /**
   * La proposition en une phrase. Elle porte tout le site : si elle change,
   * la hiérarchie du contenu change avec elle.
   */
  accroche: "Je porte des modèles de prospective dans le navigateur.",

  /**
   * Le chiffre fait le travail que l'adjectif ne fera jamais. 2·10⁻⁵ % est
   * l'écart constaté entre le portage JavaScript et le classeur d'origine,
   * mesuré automatiquement à chaque génération des données.
   */
  sousTitre:
    "Énergie, mobilité, agriculture, numérique — des classeurs Excel et des tableaux de bord Power BI devenus des applications web autonomes, sans serveur. Vérifiées contre le modèle d'origine à 2·10⁻⁵ % près.",

  description:
    "Portfolio d'Esteban Beretti — ingénierie de la donnée, portage de modèles de prospective vers le web, applications d'analyse sans serveur (DuckDB-WASM, Parquet) et systèmes de recherche augmentée.",
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
  href: string;
  label: string;
  description: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/travaux",
    label: "Travaux",
    description: "Simulateurs de prospective, pipelines de données, systèmes de recherche",
  },
  {
    href: "/labo",
    label: "Labo",
    description: "Simulations interactives : comportements émergents, clustering, systèmes temps réel",
  },
  {
    href: "/methode",
    label: "Méthode",
    description: "Comment je travaille avec des agents de code, et ce que je ne leur délègue pas",
  },
  {
    href: "/parcours",
    label: "Parcours",
    description: "Formation, alternance, compétences",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Pour en parler",
  },
] as const;

/** Sections hors navigation principale — atteignables, non affichées. */
export const NAV_DISCRETE = [{ href: "/making-of", label: "Making-of" }] as const;

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
export const PORTRAIT: { src: string; alt: string } | null = {
  src: "/portrait.jpg",
  alt: "Portrait d'Esteban Beretti-Prenant",
};
