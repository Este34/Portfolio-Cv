// Import relatif volontaire : ce module est aussi chargé par les scripts de
// build sous Node, qui ne connaissent pas l'alias « @/ » de TypeScript.
import type { Bilingue, Langue } from "../lib/langue.ts";
import { EMPLOYEUR } from "../lib/site.ts";

/**
 * Les travaux, source unique de vérité.
 *
 * Ce fichier alimente à la fois :
 *  - le rendu statique des pages (au build), dans les deux langues ;
 *  - `public/data/portfolio.json`, interrogeable dans la console SQL ;
 *  - `public/data/embeddings.bin`, le corpus du moteur de recherche.
 *
 * **Anonymisation** — aucun nom d'organisme, d'institut, de site, de modèle ni
 * de territoire ne doit apparaître ici. Voir `EMPLOYEUR` dans `lib/site.ts`.
 *
 * **Bilinguisme** — les champs de prose sont des objets `{ fr, en }`. Les noms
 * de technologies restent des chaînes simples : ce sont des noms propres, les
 * traduire n'aurait pas de sens.
 */

export type Confidentialite = "public" | "anonymise";

export type Chiffre = {
  valeur: Bilingue;
  libelle: Bilingue;
  /** Précision affichée en annotation sous le chiffre. */
  note?: Bilingue;
};

export type Decision = {
  /** Le choix, formulé comme un choix. */
  choix: Bilingue;
  /** Pourquoi — c'est cette partie qui vaut quelque chose. */
  raison: Bilingue;
};

export type Travail = {
  slug: string;
  titre: Bilingue;
  sousTitre: Bilingue;
  /** Une phrase, lisible seule, pour les listes et le moteur de recherche. */
  resume: Bilingue;
  annee: string;
  role: Bilingue;
  confidentialite: Confidentialite;
  /** Ordre d'affichage : 1 en tête. */
  rang: number;
  domaines: readonly Bilingue[];
  /** Noms propres : non traduits. */
  stack: readonly string[];
  chiffres: readonly Chiffre[];
  contexte: Bilingue;
  contraintes: readonly Bilingue[];
  decisions: readonly Decision[];
  resultats: readonly Bilingue[];
  liens: {
    depot?: string;
    demo?: string;
  };
  /**
   * Captures prises sur les déploiements réels.
   *
   * Pour les travaux sous anonymat, la neutralisation est appliquée au document
   * vivant avant le déclenchement de la capture : logos retirés, noms de
   * modèles et territoires réécrits. Ce qui est photographié est déjà propre,
   * il n'existe aucune image intermédiaire à effacer.
   */
  captures?: readonly { src: string; legende: Bilingue }[];
};

export const TRAVAUX: readonly Travail[] = [
  {
    slug: "suite-simulateurs-prospective",
    titre: {
      fr: "Une suite de simulateurs de prospective",
      en: "A suite of foresight simulators",
    },
    sousTitre: {
      fr: "Quatre modèles de transition, portés d'Excel vers le navigateur",
      en: "Four transition models, ported from Excel to the browser",
    },
    resume: {
      fr: "Quatre applications web autonomes qui rejouent, dans le navigateur et sans serveur, des modèles de prospective à l'horizon 2050 sur l'énergie, la mobilité, l'agriculture et le numérique.",
      en: "Four self-contained web applications that replay 2050 foresight models for energy, mobility, agriculture and digital infrastructure, in the browser, with no server involved.",
    },
    annee: "2026",
    role: {
      fr: `Conception et développement, en alternance dans ${EMPLOYEUR.libelle.fr}`,
      en: `Design and development, as an apprentice at ${EMPLOYEUR.libelle.en}`,
    },
    confidentialite: "anonymise",
    rang: 1,
    domaines: [
      { fr: "Modélisation", en: "Modelling" },
      { fr: "Portage de modèle", en: "Model porting" },
      { fr: "Visualisation de données", en: "Data visualisation" },
    ],
    stack: ["JavaScript", "Python", "openpyxl", "Chart.js", "noUiSlider", "Design system DSFR"],
    chiffres: [
      {
        // Décimale et non « 2·10⁻⁵ % » : la notation scientifique est juste,
        // mais elle se lit mal en gros corps et l'accueil affiche déjà la forme
        // décimale. Deux écritures du même chiffre font douter de l'une des deux.
        valeur: { fr: "0,00002 %", en: "0.00002%" },
        libelle: { fr: "écart au modèle d'origine", en: "drift from the source model" },
        note: {
          fr: "mesuré automatiquement, échec du build au-delà de 0,1 %",
          en: "measured automatically; the build fails past 0.1%",
        },
      },
      {
        valeur: { fr: "4", en: "4" },
        libelle: { fr: "domaines couverts", en: "domains covered" },
        note: {
          fr: "énergie, mobilité, agriculture, numérique",
          en: "energy, mobility, agriculture, digital",
        },
      },
      {
        valeur: { fr: "93", en: "93" },
        libelle: { fr: "cultures paramétrables", en: "configurable crops" },
        note: { fr: "sur le seul volet agricole", en: "in the agriculture module alone" },
      },
      {
        valeur: { fr: "0", en: "0" },
        libelle: { fr: "serveur requis", en: "servers required" },
        note: { fr: "un fichier HTML suffit", en: "a single HTML file is enough" },
      },
    ],
    contexte: {
      fr: "Les équipes s'appuyaient sur des classeurs Excel de plusieurs dizaines de feuilles, doublés de tableaux de bord Power BI. Consulter un scénario supposait d'avoir le classeur, la bonne version, la licence, et de savoir rejouer les macros. Les résultats circulaient en captures d'écran. Ma mission : rendre ces modèles consultables et manipulables par n'importe qui, depuis un navigateur.",
      en: "The teams worked from Excel workbooks running to dozens of sheets, backed by Power BI dashboards. Looking up a scenario meant having the workbook, the right version of it, a licence, and knowing how to re-run the macros. Results circulated as screenshots. My brief: make those models something anyone could open and manipulate from a browser.",
    },
    contraintes: [
      {
        fr: "Aucun serveur applicatif : les livrables devaient pouvoir être envoyés par courriel et ouverts hors ligne.",
        en: "No application server: deliverables had to be emailable and openable offline.",
      },
      {
        fr: "Fidélité non négociable au modèle d'origine. Un simulateur qui diverge du classeur ne vaut rien, il crée deux vérités.",
        en: "Non-negotiable fidelity to the source model. A simulator that diverges from the workbook is worse than useless: it creates a second truth.",
      },
      {
        fr: "Aucune donnée source sensible ni classeur d'origine versionné dans les dépôts.",
        en: "No sensitive source data and no original workbook committed to the repositories.",
      },
      {
        fr: "Un design system imposé, commun aux quatre outils.",
        en: "A mandated design system, shared across all four tools.",
      },
    ],
    decisions: [
      {
        choix: {
          fr: "Porter les formules du classeur en JavaScript plutôt que pré-calculer tous les scénarios",
          en: "Port the workbook formulas to JavaScript rather than pre-compute every scenario",
        },
        raison: {
          fr: "Pré-calculer aurait figé l'outil sur les quelques scénarios de référence. Porter le modèle rend le scénario libre réellement éditable : on bouge un paramètre, toute la chaîne se recalcule, sans repasser par Excel.",
          en: "Pre-computing would have frozen the tool on the handful of reference scenarios. Porting the model makes the free scenario genuinely editable: move one parameter and the whole chain recalculates, with no trip back through Excel.",
        },
      },
      {
        choix: {
          fr: "Vérifier le portage automatiquement, et faire échouer la génération au-delà de 0,1 % d'écart",
          en: "Verify the port automatically, and fail the data generation past 0.1% drift",
        },
        raison: {
          fr: "C'est la seule façon de tenir la promesse de fidélité dans la durée. Le générateur rejoue les trajectoires de référence avec le modèle porté et les compare feuille à feuille. Écart constaté : 0,00002 %.",
          en: "It is the only way to keep the fidelity promise over time. The generator replays the reference trajectories through the ported model and compares them sheet by sheet. Observed drift: 0.00002%.",
        },
      },
      {
        choix: {
          fr: "JavaScript sans build, en modules chargés par ordre de balises",
          en: "Build-free JavaScript, with modules loaded in script-tag order",
        },
        raison: {
          fr: "La contrainte « un seul fichier ouvrable hors ligne » disqualifiait un bundler. Le coût, un ordre de chargement à respecter, est faible et documenté ; le bénéfice est un livrable qui survit à n'importe quel poste de travail.",
          en: "The «single file, openable offline» constraint ruled out a bundler. The cost is a load order to respect: small, and documented. The benefit is a deliverable that survives any workstation it lands on.",
        },
      },
      {
        choix: {
          fr: "Traiter un champ vide comme « suivre le tendanciel », et non comme zéro",
          en: "Treat an empty field as «follow the baseline trend», not as zero",
        },
        raison: {
          fr: "C'est la convention du modèle d'origine. Sans elle, ouvrir le mode libre aurait gelé les 93 cultures à leur niveau de départ, et la trajectoire tendancielle serait devenue inatteignable depuis l'écran censé la prolonger.",
          en: "That is the source model's own convention. Without it, opening free mode would have frozen all 93 crops at their starting level, making the baseline trajectory unreachable from the very screen meant to extend it.",
        },
      },
    ],
    resultats: [
      {
        fr: "Quatre simulateurs en service, consultables sans licence ni installation.",
        en: "Four simulators in service, usable with no licence and no installation.",
      },
      {
        fr: "Les scénarios de référence sont explorables par des non-spécialistes ; les paramètres experts restent accessibles derrière un mode dédié.",
        en: "Reference scenarios are explorable by non-specialists, while expert parameters stay available behind a dedicated mode.",
      },
      {
        fr: "Chaque livrable existe en deux formes : un fichier HTML autonome pour l'échange par courriel, et une version hébergée.",
        en: "Every deliverable exists in two forms: a self-contained HTML file for sending by email, and a hosted version.",
      },
      {
        fr: "La régénération des données depuis le classeur est scriptée, vérifiée et reproductible.",
        en: "Regenerating the data from the workbook is scripted, verified and reproducible.",
      },
      {
        fr: "Une version publiable de l'un des quatre simulateurs est jouable sur ce site, avec ses données intégralement régénérées.",
        en: "A publishable version of one of the four simulators is playable on this site, with its data entirely regenerated.",
      },
    ],
    /*
     * Lien interne uniquement. Le dépôt reste privé ; ce qui est ouvert au
     * public est une version neutralisée hébergée ici — code et interface
     * d'origine, valeurs fabriquées.
     */
    captures: [
      {
        src: "/captures/simulateur-energie.png",
        legende: {
          fr: "Volet énergie : scénarios de référence, parc pilotable et étalement de la matière.",
          en: "Energy module: reference scenarios, a steerable generation fleet, and material spread over time.",
        },
      },
      {
        src: "/captures/simulateur-numerique.png",
        legende: {
          fr: "Volet numérique : parc d'équipements, matières mobilisées et soutenabilité.",
          en: "Digital module: the device fleet, the materials it draws on, and sustainability.",
        },
      },
      {
        src: "/captures/simulateur-mobilite.png",
        legende: {
          fr: "Volet mobilité : passagers-kilomètres et flux de matières par système de transport.",
          en: "Mobility module: passenger-kilometres and material flows by transport system.",
        },
      },
      {
        src: "/captures/simulateur-agriculture.png",
        legende: {
          fr: "Volet agriculture : surfaces, cheptel et pratiques, à l'échelle de la culture.",
          en: "Agriculture module: land area, livestock and practices, down to the individual crop.",
        },
      },
    ],
    liens: { demo: "/demonstration" },
  },

  {
    slug: "plateforme-simulateurs",
    titre: { fr: "La plateforme qui les héberge", en: "The platform that hosts them" },
    sousTitre: {
      fr: "Site vitrine et socle commun des simulateurs",
      en: "Public site and shared foundation for the simulators",
    },
    resume: {
      fr: "Un site vitrine en Next.js qui présente l'activité de l'équipe et héberge les simulateurs, avec un socle de composants partagé et des fonds WebGL écrits à la main.",
      en: "A Next.js site that presents the team's work and hosts the simulators, built on a shared component foundation with hand-written WebGL backgrounds.",
    },
    annee: "2026",
    role: {
      fr: `Conception et développement, en alternance dans ${EMPLOYEUR.libelle.fr}`,
      en: `Design and development, as an apprentice at ${EMPLOYEUR.libelle.en}`,
    },
    confidentialite: "anonymise",
    rang: 2,
    domaines: [
      { fr: "Développement web", en: "Web development" },
      { fr: "Design system", en: "Design system" },
      { fr: "WebGL", en: "WebGL" },
    ],
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
      {
        valeur: { fr: "4", en: "4" },
        libelle: { fr: "simulateurs hébergés", en: "simulators hosted" },
      },
      {
        valeur: { fr: "0", en: "0" },
        libelle: { fr: "dépendance 3D pour les fonds", en: "3D dependencies for the backgrounds" },
        note: { fr: "shaders GLSL écrits à la main", en: "hand-written GLSL shaders" },
      },
      {
        valeur: { fr: "TS", en: "TS" },
        libelle: { fr: "strict", en: "strict" },
        note: {
          fr: "typage vérifié en intégration continue",
          en: "types checked in continuous integration",
        },
      },
    ],
    contexte: {
      fr: "Les simulateurs existaient, mais chacun dans son coin, sans porte d'entrée commune ni discours qui les relie. Il fallait un site qui présente la démarche, donne accès aux outils, et serve de socle réutilisable pour les suivants.",
      en: "The simulators existed, but each on its own, with no shared front door and nothing tying them together. What was needed was a site that explained the approach, opened access to the tools, and served as a reusable base for whatever came next.",
    },
    contraintes: [
      {
        fr: "Respecter une charte graphique imposée, jetons de couleur compris.",
        en: "Respect a mandated visual identity, colour tokens included.",
      },
      {
        fr: "Interface, contenus et commentaires du code en français.",
        en: "Interface, content and code comments in French.",
      },
      {
        fr: "Rester hébergeable simplement, sans infrastructure dédiée.",
        en: "Stay simple to host, with no dedicated infrastructure.",
      },
    ],
    decisions: [
      {
        choix: {
          fr: "Écrire les fonds animés en GLSL plutôt qu'importer une bibliothèque 3D",
          en: "Write the animated backgrounds in GLSL instead of importing a 3D library",
        },
        raison: {
          fr: "Les fonds n'avaient besoin ni de scène, ni de caméra, ni de chargeur de modèles. Un shader sur un quad plein écran fait le travail pour une fraction du poids, et reste lisible.",
          en: "The backgrounds needed no scene, no camera and no model loader. A shader on a full-screen quad does the job for a fraction of the weight, and stays readable.",
        },
      },
      {
        choix: {
          fr: "Une source unique de vérité pour l'identité du site",
          en: "One single source of truth for the site's identity",
        },
        raison: {
          fr: "La version précédente répétait le domaine de production dans onze pages HTML : canonical, Open Graph, sitemap, robots. Un seul module exporte désormais tout cela ; il n'y a plus de valeur à oublier lors d'un changement.",
          en: "The previous version repeated the production domain across eleven HTML pages: canonical tags, Open Graph, sitemap, robots. A single module now exports all of it, so there is no longer a value left behind when something changes.",
        },
      },
      {
        choix: {
          fr: "Sortir les quatre domaines de la navigation principale",
          en: "Move the four domains out of the main navigation",
        },
        raison: {
          fr: "À huit entrées, la barre atteignait environ 1150 px et débordait sur le logo entre 1024 et 1150 px. Les pages restent servies et référencées : seul le chemin d'accès change.",
          en: "At eight items the bar reached roughly 1150 px and overlapped the logo between 1024 and 1150 px. The pages are still served and still indexed; only the route in changes.",
        },
      },
    ],
    resultats: [
      {
        fr: "Une porte d'entrée unique vers les quatre simulateurs.",
        en: "A single front door to all four simulators.",
      },
      {
        fr: "Un socle de composants réutilisé par les outils suivants.",
        en: "A component foundation reused by the tools that followed.",
      },
      {
        fr: "Déploiement continu à chaque intégration sur la branche principale.",
        en: "Continuous deployment on every merge to the main branch.",
      },
    ],
    captures: [
      {
        src: "/captures/plateforme.png",
        legende: {
          fr: "La page d'accueil de la plateforme, et son fond animé écrit en GLSL.",
          en: "The platform's home page, and its animated background written in GLSL.",
        },
      },
    ],
    liens: {},
  },

  {
    slug: "pipeline-comtrade",
    titre: {
      fr: "Les flux mondiaux de minéraux critiques",
      en: "Global flows of critical minerals",
    },
    sousTitre: {
      fr: "Vingt-cinq ans de déclarations douanières, interrogeables hors ligne",
      en: "Twenty-five years of customs declarations, queryable offline",
    },
    resume: {
      fr: "Une application d'analyse des chaînes d'approvisionnement en matières critiques, adossée à un pipeline en trois phases : extraction massive depuis l'API des Nations unies, nettoyage et export Parquet, puis interrogation intégralement dans le navigateur via DuckDB-WASM.",
      en: "A supply-chain analysis application for critical raw materials, backed by a three-stage pipeline: bulk extraction from the United Nations API, cleaning and export to Parquet, then querying entirely in the browser through DuckDB-WASM.",
    },
    annee: "2026",
    role: {
      fr: "Seul aux commandes : conception, pipeline, modèle de données et interface",
      en: "Sole owner: design, pipeline, data model and interface",
    },
    confidentialite: "public",
    rang: 3,
    domaines: [
      { fr: "Ingénierie de la donnée", en: "Data engineering" },
      { fr: "Analyse", en: "Analytics" },
      { fr: "Visualisation de données", en: "Data visualisation" },
    ],
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
      {
        valeur: { fr: "240", en: "240" },
        libelle: { fr: "pays déclarants", en: "reporting countries" },
      },
      {
        valeur: { fr: "2000-2025", en: "2000-2025" },
        libelle: { fr: "profondeur historique", en: "years of history" },
      },
      {
        valeur: { fr: "97", en: "97" },
        libelle: { fr: "chapitres produits", en: "product chapters" },
        note: {
          fr: "classification harmonisée à 2 chiffres",
          en: "2-digit Harmonized System classification",
        },
      },
      {
        valeur: { fr: "100 %", en: "100%" },
        libelle: { fr: "des requêtes côté client", en: "of queries run client-side" },
        note: {
          fr: "aucune donnée ne quitte le navigateur",
          en: "no data ever leaves the browser",
        },
      },
    ],
    contexte: {
      fr: "Analyser les chaînes d'approvisionnement en matières critiques suppose de croiser des déclarations douanières bilatérales sur deux décennies. L'API source est payante et limitée en débit ; les volumes dépassent ce qu'un tableur absorbe. Il fallait un pipeline qui extraie une fois, proprement, et une interface qui interroge ensuite sans rien redemander.",
      en: "Analysing critical-material supply chains means cross-referencing bilateral customs declarations across two decades. The source API is paid and rate-limited, and the volumes exceed what a spreadsheet can absorb. What was needed was a pipeline that extracts once, cleanly, and an interface that then queries without ever asking again.",
    },
    contraintes: [
      {
        fr: "API payante et limitée : ne jamais retélécharger un couple (déclarant, année) déjà obtenu.",
        en: "Paid, rate-limited API: never re-download a (reporter, year) pair already retrieved.",
      },
      {
        fr: "L'extraction complète dure des heures et sera interrompue. La reprise doit être automatique.",
        en: "A full extraction runs for hours and will be interrupted. Resuming has to be automatic.",
      },
      {
        fr: "L'analyse devait rester utilisable sans backend, donc sans coût d'hébergement ni exposition des données.",
        en: "The analysis had to stay usable with no backend, therefore with no hosting cost and no data exposure.",
      },
    ],
    decisions: [
      {
        choix: {
          fr: "Un point de reprise sur disque, consulté avant chaque appel",
          en: "A checkpoint on disk, consulted before every call",
        },
        raison: {
          fr: "Les couples déjà traités et les échecs définitifs sont journalisés séparément. Une interruption se reprend au lancement suivant, et les échecs se rejouent seuls — après cinq tentatives en repli exponentiel.",
          en: "Completed pairs and permanent failures are journalled separately. An interruption picks up on the next run, and failures replay on their own, after five attempts with exponential backoff.",
        },
      },
      {
        choix: {
          fr: "Parquet partitionné plutôt qu'une base servie",
          en: "Partitioned Parquet rather than a served database",
        },
        raison: {
          fr: "Le format colonnaire se lit par morceaux depuis un stockage statique. Combiné à DuckDB-WASM, il donne une analyse interactive sans la moindre machine à maintenir.",
          en: "The columnar format reads in chunks straight from static storage. Combined with DuckDB-WASM, it yields interactive analysis without a single machine to maintain.",
        },
      },
      {
        choix: {
          fr: "Diffuser les jeux de données par les releases du dépôt",
          en: "Distribute the datasets through the repository's releases",
        },
        raison: {
          fr: "Les fichiers dépassent ce qu'un dépôt Git doit porter, et l'hébergement statique du site n'est pas fait pour ça. Les releases versionnent les données comme le code versionne le pipeline.",
          en: "The files exceed what a Git repository should carry, and the site's static hosting is not built for it. Releases version the data the way the repository versions the pipeline.",
        },
      },
    ],
    resultats: [
      {
        fr: "Cinq angles d'analyse : chaînes de valeur, dépendances entre pays, origine des matières, comparaison de minerais, suivi produit détaillé.",
        en: "Five analytical angles: value chains, country-to-country dependencies, material origin, ore comparison, and detailed product tracking.",
      },
      {
        fr: "Traitement dédié des matières critiques, avec pré-agrégation et vue bilatérale.",
        en: "Dedicated handling of critical materials, with pre-aggregation and a bilateral view.",
      },
      {
        fr: "Application déployée et consultable publiquement.",
        en: "Application deployed and publicly available.",
      },
    ],
    captures: [
      {
        src: "/captures/comtrade.png",
        legende: {
          fr: "L'application d'analyse : des requêtes DuckDB-WASM sur vingt-cinq ans de déclarations douanières, sans serveur.",
          en: "The analysis application: DuckDB-WASM queries over twenty-five years of customs declarations, with no server.",
        },
      },
    ],
    liens: {
      depot: "https://github.com/Este34/pipeline-comtrade",
      demo: "https://recherchecomtrade.vercel.app",
    },
  },

  {
    slug: "mon-rag",
    titre: { fr: "Un RAG écrit à la main", en: "A RAG system written by hand" },
    sousTitre: {
      fr: "Comprendre la recherche augmentée en l'implémentant sans framework",
      en: "Understanding retrieval-augmented generation by building it without a framework",
    },
    resume: {
      fr: "Un système de recherche augmentée écrit de zéro en Python (vectorisation, similarité cosinus, génération locale), délibérément sans bibliothèque d'orchestration, pour en maîtriser chaque étage.",
      en: "A retrieval-augmented system written from scratch in Python (embeddings, cosine similarity, local generation), deliberately without an orchestration library, in order to own every layer of it.",
    },
    annee: "2026",
    role: { fr: "Projet personnel", en: "Personal project" },
    confidentialite: "public",
    rang: 4,
    domaines: [
      { fr: "Intelligence artificielle", en: "Artificial intelligence" },
      { fr: "Recherche d'information", en: "Information retrieval" },
    ],
    stack: ["Python", "sentence-transformers", "all-MiniLM-L6-v2", "NumPy", "Ollama", "Llama 3.2"],
    chiffres: [
      {
        valeur: { fr: "384", en: "384" },
        libelle: { fr: "dimensions par vecteur", en: "dimensions per vector" },
      },
      {
        valeur: { fr: "0", en: "0" },
        libelle: { fr: "framework d'orchestration", en: "orchestration frameworks" },
        note: { fr: "ni LangChain, ni LlamaIndex", en: "no LangChain, no LlamaIndex" },
      },
      {
        valeur: { fr: "100 %", en: "100%" },
        libelle: { fr: "en local", en: "local" },
        note: { fr: "aucun appel à une API tierce", en: "not a single third-party API call" },
      },
    ],
    contexte: {
      fr: "Les bibliothèques d'orchestration rendent un prototype de recherche augmentée trivial à assembler, et opaque à comprendre. J'ai voulu l'inverse : écrire chaque étage moi-même pour savoir exactement où se perdent la pertinence et le contexte.",
      en: "Orchestration libraries make a retrieval-augmented prototype trivial to assemble and opaque to understand. I wanted the opposite: to write every layer myself, so I would know exactly where relevance and context get lost.",
    },
    contraintes: [
      {
        fr: "Tourner intégralement en local, sans clé d'API ni service tiers.",
        en: "Run entirely locally, with no API key and no third-party service.",
      },
      {
        fr: "Rester assez court pour être lu d'un bout à l'autre et servir de support pédagogique.",
        en: "Stay short enough to be read end to end and to work as teaching material.",
      },
    ],
    decisions: [
      {
        choix: {
          fr: "Similarité cosinus en NumPy plutôt qu'une base vectorielle",
          en: "Cosine similarity in NumPy rather than a vector database",
        },
        raison: {
          fr: "À l'échelle d'un corpus personnel, un produit scalaire sur une matrice tient en une ligne et s'exécute instantanément. Une base vectorielle aurait ajouté une dépendance, un service et une abstraction pour résoudre un problème qui n'existe pas encore.",
          en: "At the scale of a personal corpus, a dot product over a matrix fits on one line and runs instantly. A vector database would have added a dependency, a service and an abstraction to solve a problem that does not exist yet.",
        },
      },
      {
        choix: {
          fr: "Un modèle d'embedding compact et un modèle de génération local",
          en: "A compact embedding model and a local generation model",
        },
        raison: {
          fr: "384 dimensions suffisent largement pour de la recherche documentaire personnelle, et le couple tient sur une machine ordinaire, ce qui rend le projet reproductible par quiconque le clone.",
          en: "384 dimensions are more than enough for personal document search, and the pair fits on an ordinary machine, which makes the project reproducible by anyone who clones it.",
        },
      },
    ],
    resultats: [
      {
        fr: "Un système fonctionnel en un seul fichier lisible, accompagné d'un guide qui explique chaque composant.",
        en: "A working system in one readable file, with a guide that explains each component.",
      },
      {
        fr: "Le socle direct du moteur de recherche de ce portfolio : même modèle, porté cette fois dans le navigateur.",
        en: "The direct basis for this portfolio's own search engine: the same model, this time ported into the browser.",
      },
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
export function stackAgregee(langue: Langue): { nom: string; occurrences: number }[] {
  const compte = new Map<string, number>();
  for (const t of TRAVAUX) {
    for (const s of t.stack) compte.set(s, (compte.get(s) ?? 0) + 1);
  }
  return [...compte.entries()]
    .map(([nom, occurrences]) => ({ nom, occurrences }))
    .sort(
      (a, b) =>
        b.occurrences - a.occurrences || a.nom.localeCompare(b.nom, langue === "fr" ? "fr" : "en"),
    );
}
