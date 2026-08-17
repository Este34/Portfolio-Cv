// Import relatif volontaire : ce module est aussi chargé par les scripts de
// build sous Node, qui ne connaissent pas l'alias « @/ » de TypeScript.
import { EMPLOYEUR } from "../lib/site.ts";

/**
 * Les travaux, source unique de vérité.
 *
 * Ce fichier alimente à la fois :
 *  - le rendu statique des pages (au build) ;
 *  - `public/data/portfolio.parquet`, interrogeable dans la console SQL ;
 *  - `public/data/embeddings.bin`, le corpus du moteur de recherche.
 *
 * **Anonymisation** — aucun nom d'organisme, d'institut, de site, de modèle ni
 * de territoire ne doit apparaître ici. Voir `EMPLOYEUR` dans `lib/site.ts`.
 */

export type Confidentialite = "public" | "anonymise";

export type Chiffre = {
  valeur: string;
  libelle: string;
  /** Précision affichée en annotation sous le chiffre. */
  note?: string;
};

export type Decision = {
  /** Le choix, formulé comme un choix. */
  choix: string;
  /** Pourquoi — c'est cette partie qui vaut quelque chose. */
  raison: string;
};

export type Travail = {
  slug: string;
  titre: string;
  sousTitre: string;
  /** Une phrase, lisible seule, pour les listes et le RAG. */
  resume: string;
  annee: string;
  role: string;
  confidentialite: Confidentialite;
  /** Ordre d'affichage : 1 en tête. */
  rang: number;
  domaines: readonly string[];
  stack: readonly string[];
  chiffres: readonly Chiffre[];
  contexte: string;
  contraintes: readonly string[];
  decisions: readonly Decision[];
  resultats: readonly string[];
  liens: {
    depot?: string;
    demo?: string;
  };
};

export const TRAVAUX: readonly Travail[] = [
  {
    slug: "suite-simulateurs-prospective",
    titre: "Une suite de simulateurs de prospective",
    sousTitre: "Quatre modèles de transition, portés d'Excel vers le navigateur",
    resume:
      "Quatre applications web autonomes qui rejouent, dans le navigateur et sans serveur, des modèles de prospective à l'horizon 2050 sur l'énergie, la mobilité, l'agriculture et le numérique.",
    annee: "2026",
    role: `Conception et développement, en alternance dans ${EMPLOYEUR.libelle}`,
    confidentialite: "anonymise",
    rang: 1,
    domaines: ["Modélisation", "Portage de modèle", "Visualisation de données"],
    stack: [
      "JavaScript",
      "Python",
      "openpyxl",
      "Chart.js",
      "noUiSlider",
      "Design system de l'État (DSFR)",
    ],
    chiffres: [
      {
        valeur: "2·10⁻⁵ %",
        libelle: "écart au modèle d'origine",
        note: "mesuré automatiquement, échec du build au-delà de 0,1 %",
      },
      { valeur: "4", libelle: "domaines couverts", note: "énergie, mobilité, agriculture, numérique" },
      { valeur: "93", libelle: "cultures paramétrables", note: "sur le seul volet agricole" },
      { valeur: "0", libelle: "serveur requis", note: "un fichier HTML suffit" },
    ],
    contexte: `Les équipes s'appuyaient sur des classeurs Excel de plusieurs dizaines de feuilles, doublés de tableaux de bord Power BI. Consulter un scénario supposait d'avoir le classeur, la bonne version, la licence, et de savoir rejouer les macros. Les résultats circulaient en captures d'écran. Ma mission : rendre ces modèles consultables et manipulables par n'importe qui, depuis un navigateur.`,
    contraintes: [
      "Aucun serveur applicatif : les livrables devaient pouvoir être envoyés par courriel et ouverts hors ligne.",
      "Fidélité non négociable au modèle d'origine — un simulateur qui diverge du classeur ne vaut rien, il crée deux vérités.",
      "Aucune donnée source sensible ni classeur d'origine versionné dans les dépôts.",
      "Un design system imposé, commun aux quatre outils.",
    ],
    decisions: [
      {
        choix: "Porter les formules du classeur en JavaScript plutôt que pré-calculer tous les scénarios",
        raison:
          "Pré-calculer aurait figé l'outil sur les quelques scénarios de référence. Porter le modèle rend le scénario libre réellement éditable : on bouge un paramètre, toute la chaîne se recalcule, sans repasser par Excel.",
      },
      {
        choix: "Vérifier le portage automatiquement, et faire échouer la génération au-delà de 0,1 % d'écart",
        raison:
          "C'est la seule façon de tenir la promesse de fidélité dans la durée. Le générateur rejoue les trajectoires de référence avec le modèle porté et les compare feuille à feuille. Écart constaté : 2·10⁻⁵ %.",
      },
      {
        choix: "JavaScript sans build, en modules chargés par ordre de balises",
        raison:
          "La contrainte « un seul fichier ouvrable hors ligne » disqualifiait un bundler. Le coût — un ordre de chargement à respecter — est faible et documenté ; le bénéfice est un livrable qui survit à n'importe quel poste de travail.",
      },
      {
        choix: "Traiter un champ vide comme « suivre le tendanciel », et non comme zéro",
        raison:
          "C'est la convention du modèle d'origine. Sans elle, ouvrir le mode libre aurait gelé les 93 cultures à leur niveau de départ, et la trajectoire tendancielle serait devenue inatteignable depuis l'écran censé la prolonger.",
      },
    ],
    resultats: [
      "Quatre simulateurs en service, consultables sans licence ni installation.",
      "Les scénarios de référence sont explorables par des non-spécialistes ; les paramètres experts restent accessibles derrière un mode dédié.",
      "Chaque livrable existe en deux formes : un fichier HTML autonome pour l'échange par courriel, et une version hébergée.",
      "La régénération des données depuis le classeur est scriptée, vérifiée et reproductible.",
    ],
    liens: {},
  },

  {
    slug: "plateforme-simulateurs",
    titre: "La plateforme qui les héberge",
    sousTitre: "Site vitrine et socle commun des simulateurs",
    resume:
      "Un site vitrine en Next.js qui présente l'activité de l'équipe et héberge les simulateurs, avec un socle de composants partagé et des fonds WebGL écrits à la main.",
    annee: "2026",
    role: `Conception et développement, en alternance dans ${EMPLOYEUR.libelle}`,
    confidentialite: "anonymise",
    rang: 2,
    domaines: ["Développement web", "Design system", "WebGL"],
    stack: [
      "Next.js 16",
      "React 19",
      "TypeScript strict",
      "Tailwind CSS v4",
      "Radix UI",
      "motion",
      "GLSL",
      "Chart.js",
      "zod",
      "Vitest",
      "Playwright",
      "Vercel",
    ],
    chiffres: [
      { valeur: "4", libelle: "simulateurs hébergés" },
      { valeur: "0", libelle: "dépendance 3D pour les fonds", note: "shaders GLSL écrits à la main" },
      { valeur: "TS", libelle: "strict", note: "typage vérifié en intégration continue" },
    ],
    contexte:
      "Les simulateurs existaient, mais chacun dans son coin, sans porte d'entrée commune ni discours qui les relie. Il fallait un site qui présente la démarche, donne accès aux outils, et serve de socle réutilisable pour les suivants.",
    contraintes: [
      "Respecter une charte graphique imposée, jetons de couleur compris.",
      "Interface, contenus et commentaires du code en français.",
      "Rester hébergeable simplement, sans infrastructure dédiée.",
    ],
    decisions: [
      {
        choix: "Écrire les fonds animés en GLSL plutôt qu'importer une bibliothèque 3D",
        raison:
          "Les fonds n'avaient besoin ni de scène, ni de caméra, ni de chargeur de modèles. Un shader sur un quad plein écran fait le travail pour une fraction du poids, et reste lisible.",
      },
      {
        choix: "Une source unique de vérité pour l'identité du site",
        raison:
          "La version précédente répétait le domaine de production dans onze pages HTML — canonical, Open Graph, sitemap, robots. Un seul module exporte désormais tout cela ; il n'y a plus de valeur à oublier lors d'un changement.",
      },
      {
        choix: "Sortir les quatre domaines de la navigation principale",
        raison:
          "À huit entrées, la barre atteignait environ 1150 px et débordait sur le logo entre 1024 et 1150 px. Les pages restent servies et référencées : seul le chemin d'accès change.",
      },
    ],
    resultats: [
      "Une porte d'entrée unique vers les quatre simulateurs.",
      "Un socle de composants réutilisé par les outils suivants.",
      "Déploiement continu à chaque intégration sur la branche principale.",
    ],
    liens: {},
  },

  {
    slug: "pipeline-comtrade",
    titre: "Les flux mondiaux de minéraux critiques",
    sousTitre: "Vingt-cinq ans de déclarations douanières, interrogeables hors ligne",
    resume:
      "Une application d'analyse des chaînes d'approvisionnement en matières critiques, adossée à un pipeline en trois phases : extraction massive depuis l'API des Nations unies, nettoyage et export Parquet, puis interrogation intégralement dans le navigateur via DuckDB-WASM.",
    annee: "2026",
    role: "Seul aux commandes — conception, pipeline, modèle de données et interface",
    confidentialite: "public",
    rang: 3,
    domaines: ["Ingénierie de la donnée", "Analyse", "Visualisation de données"],
    stack: [
      "Python",
      "DuckDB",
      "Apache Parquet",
      "DuckDB-WASM",
      "JavaScript",
      "Three.js",
      "Leaflet",
      "Chart.js",
      "Vercel",
    ],
    chiffres: [
      { valeur: "240", libelle: "pays déclarants" },
      { valeur: "2000-2025", libelle: "profondeur historique" },
      { valeur: "97", libelle: "chapitres produits", note: "classification harmonisée à 2 chiffres" },
      { valeur: "100 %", libelle: "des requêtes côté client", note: "aucune donnée ne quitte le navigateur" },
    ],
    contexte:
      "Analyser les chaînes d'approvisionnement en matières critiques suppose de croiser des déclarations douanières bilatérales sur deux décennies. L'API source est payante et limitée en débit ; les volumes dépassent ce qu'un tableur absorbe. Il fallait un pipeline qui extraie une fois, proprement, et une interface qui interroge ensuite sans rien redemander.",
    contraintes: [
      "API payante et limitée : ne jamais retélécharger un couple (déclarant, année) déjà obtenu.",
      "L'extraction complète dure des heures et sera interrompue — la reprise doit être automatique.",
      "L'analyse devait rester utilisable sans backend, donc sans coût d'hébergement ni exposition des données.",
    ],
    decisions: [
      {
        choix: "Un point de reprise sur disque, consulté avant chaque appel",
        raison:
          "Les couples déjà traités et les échecs définitifs sont journalisés séparément. Une interruption se reprend au lancement suivant, et les échecs se rejouent seuls — après cinq tentatives en repli exponentiel.",
      },
      {
        choix: "Parquet partitionné plutôt qu'une base servie",
        raison:
          "Le format colonnaire se lit par morceaux depuis un stockage statique. Combiné à DuckDB-WASM, il donne une analyse interactive sans la moindre machine à maintenir.",
      },
      {
        choix: "Diffuser les jeux de données par les releases du dépôt",
        raison:
          "Les fichiers dépassent ce qu'un dépôt Git doit porter, et l'hébergement statique du site n'est pas fait pour ça. Les releases versionnent les données comme le code versionne le pipeline.",
      },
    ],
    resultats: [
      "Cinq angles d'analyse : chaînes de valeur, dépendances entre pays, origine des matières, comparaison de minerais, suivi produit détaillé.",
      "Traitement dédié des matières critiques, avec pré-agrégation et vue bilatérale.",
      "Application déployée et consultable publiquement.",
    ],
    liens: {
      depot: "https://github.com/Este34/pipeline-comtrade",
      demo: "https://recherchecomtrade.vercel.app",
    },
  },

  {
    slug: "mon-rag",
    titre: "Un RAG écrit à la main",
    sousTitre: "Comprendre la recherche augmentée en l'implémentant sans framework",
    resume:
      "Un système de recherche augmentée écrit de zéro en Python — vectorisation, similarité cosinus, génération locale — délibérément sans bibliothèque d'orchestration, pour en maîtriser chaque étage.",
    annee: "2026",
    role: "Projet personnel",
    confidentialite: "public",
    rang: 4,
    domaines: ["Intelligence artificielle", "Recherche d'information"],
    stack: ["Python", "sentence-transformers", "all-MiniLM-L6-v2", "NumPy", "Ollama", "Llama 3.2"],
    chiffres: [
      { valeur: "384", libelle: "dimensions par vecteur" },
      { valeur: "0", libelle: "framework d'orchestration", note: "ni LangChain, ni LlamaIndex" },
      { valeur: "100 %", libelle: "en local", note: "aucun appel à une API tierce" },
    ],
    contexte:
      "Les bibliothèques d'orchestration rendent un prototype de recherche augmentée trivial à assembler — et opaque à comprendre. J'ai voulu l'inverse : écrire chaque étage moi-même pour savoir exactement où se perdent la pertinence et le contexte.",
    contraintes: [
      "Tourner intégralement en local, sans clé d'API ni service tiers.",
      "Rester assez court pour être lu d'un bout à l'autre et servir de support pédagogique.",
    ],
    decisions: [
      {
        choix: "Similarité cosinus en NumPy plutôt qu'une base vectorielle",
        raison:
          "À l'échelle d'un corpus personnel, un produit scalaire sur une matrice tient en une ligne et s'exécute instantanément. Une base vectorielle aurait ajouté une dépendance, un service et une abstraction pour résoudre un problème qui n'existe pas encore.",
      },
      {
        choix: "Un modèle d'embedding compact et un modèle de génération local",
        raison:
          "384 dimensions suffisent largement pour de la recherche documentaire personnelle, et le couple tient sur une machine ordinaire — ce qui rend le projet reproductible par quiconque le clone.",
      },
    ],
    resultats: [
      "Un système fonctionnel en un seul fichier lisible, accompagné d'un guide qui explique chaque composant.",
      "Le socle direct du moteur de recherche de ce portfolio — même modèle, porté cette fois dans le navigateur.",
    ],
    liens: {
      depot: "https://github.com/Este34/mon-rag",
    },
  },
] as const;

export const TRAVAUX_TRIES = [...TRAVAUX].sort((a, b) => a.rang - b.rang);

export function travailParSlug(slug: string): Travail | undefined {
  return TRAVAUX.find((t) => t.slug === slug);
}

/** Toutes les technologies citées, dédoublonnées, par fréquence décroissante. */
export function stackAgregee(): { nom: string; occurrences: number }[] {
  const compte = new Map<string, number>();
  for (const t of TRAVAUX) {
    for (const s of t.stack) compte.set(s, (compte.get(s) ?? 0) + 1);
  }
  return [...compte.entries()]
    .map(([nom, occurrences]) => ({ nom, occurrences }))
    .sort((a, b) => b.occurrences - a.occurrences || a.nom.localeCompare(b.nom, "fr"));
}
