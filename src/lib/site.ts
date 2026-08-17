/**
 * Source unique de vérité pour l'identité du site.
 *
 * Tout ce qui est répété ailleurs (métadonnées, Open Graph, sitemap, pied de
 * page, corpus RAG) doit venir d'ici. Une chaîne dupliquée est une chaîne qui
 * finira désynchronisée.
 */

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
    "Énergie, mobilité, agriculture, numérique. Des classeurs Excel et des tableaux de bord Power BI devenus des applications web autonomes, sans serveur. Vérifiées contre le modèle d'origine à 0,00002 % près.",

  description:
    "Portfolio d'Esteban Beretti-Prenant : ingénierie de la donnée, portage de modèles de prospective vers le web, applications d'analyse sans serveur (DuckDB-WASM, Parquet) et systèmes de recherche augmentée.",
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
    href: "/demonstration",
    label: "Démonstration",
    description: "Un de mes simulateurs de prospective, jouable, en données fabriquées",
  },
  {
    href: "/bac-a-sable",
    label: "Bac à sable",
    description: "Déposez vos données, interrogez-les en SQL dans votre navigateur",
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
