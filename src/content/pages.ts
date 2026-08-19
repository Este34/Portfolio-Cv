import type { Bilingue } from "../lib/langue.ts";

/**
 * La prose des pages, sortie des gabarits.
 *
 * Elle y était écrite en JSX, ce qui allait tant qu'il n'y avait qu'une langue.
 * Deux versions d'un même paragraphe entrelacées dans du balisage seraient
 * devenues illisibles, et surtout impossibles à relire d'une traite. Les pages
 * sont désormais des gabarits, et le texte vit ici.
 *
 * Effet de bord utile : le corpus du moteur de recherche peut puiser dans ce
 * fichier au lieu de recopier des phrases à la main.
 */

type Meta = { titre: Bilingue; description: Bilingue };

/* -------------------------------------------------------------------------- */
/* Accueil                                                                     */
/* -------------------------------------------------------------------------- */

export const ACCUEIL = {
  chiffres: [
    {
      valeur: { fr: "0,00002 %", en: "0.00002%" },
      libelle: { fr: "écart au modèle d'origine", en: "drift from the source model" },
      bloc: "bloc-bleu",
    },
    {
      valeur: { fr: "4", en: "4" },
      libelle: { fr: "modèles de prospective portés", en: "foresight models ported" },
      bloc: "bloc-corail",
    },
    {
      valeur: { fr: "240", en: "240" },
      libelle: { fr: "pays dans le pipeline", en: "countries in the pipeline" },
      bloc: "bloc-citron",
    },
    {
      valeur: { fr: "0", en: "0" },
      libelle: { fr: "serveur d'analyse", en: "analytics servers" },
      bloc: "bg-trait-fort text-fond",
    },
  ],

  recit: {
    surTitre: { fr: "Comment j'y suis arrivé", en: "How I got here" },
    titre: {
      fr: "Des sciences cognitives à la donnée",
      en: "From cognitive science to data",
    },
    /*
     * Écrit à la première personne et au passé : un portfolio qui n'énumère que
     * des compétences ne dit pas pourquoi la personne les a acquises. Chaque
     * paragraphe est vérifiable — diplôme, sélection, alternance, chiffres.
     */
    paragraphes: [
      {
        fr: "J'ai commencé par les sciences cognitives : comprendre comment on perçoit, comment on décide, comment on se trompe. Une licence de mathématiques et d'informatique appliquées aux sciences humaines, à Montpellier, où j'ai passé plus de temps sur les données que sur les théories.",
        en: "I started in cognitive science: how we perceive, how we decide, how we get things wrong. A bachelor's in mathematics and computer science applied to the social sciences, in Montpellier, where I spent more time on the data than on the theories.",
      },
      {
        fr: "En 2023, le Parlement européen m'a retenu parmi cent citoyens pour formuler des recommandations sur la mobilité d'apprentissage. J'y ai été rapporteur d'un groupe de travail : synthétiser des positions qui ne s'accordaient pas, puis les défendre en plénière. C'est là que j'ai compris qu'un travail n'existe vraiment que lorsqu'il devient lisible par ceux qui ne l'ont pas fait.",
        en: "In 2023 the European Parliament selected me among one hundred citizens to draft recommendations on learning mobility. I was rapporteur for a working group: synthesising positions that did not agree, then defending them in plenary. That is where I understood that a piece of work only really exists once the people who did not do it can read it.",
      },
      {
        fr: "Depuis juin 2026, je suis en alternance dans un institut de recherche public. On m'y a confié des modèles de prospective sur l'énergie, la mobilité, l'agriculture et le numérique, enfermés dans des classeurs de plusieurs dizaines de feuilles. Consulter un scénario supposait la bonne version du fichier, la bonne licence, et de savoir rejouer des macros. Les résultats circulaient en captures d'écran.",
        en: "Since June 2026 I have been an apprentice at a public research institute. I was handed foresight models covering energy, mobility, agriculture and digital infrastructure, locked inside workbooks running to dozens of sheets. Looking up a scenario meant the right version of the file, the right licence, and knowing how to re-run the macros. Results circulated as screenshots.",
      },
      {
        fr: "J'en ai fait quatre applications qu'on ouvre dans un navigateur. Et parce qu'un simulateur qui diverge de son classeur crée deux vérités au lieu d'une, j'ai écrit le garde-fou avant l'interface : le générateur rejoue les trajectoires de référence et refuse de produire les données au-delà de 0,1 % d'écart.",
        en: "I turned them into four applications you open in a browser. And because a simulator that diverges from its workbook creates two truths instead of one, I wrote the guardrail before the interface: the generator replays the reference trajectories and refuses to emit the data past 0.1% drift.",
      },
      {
        fr: "À la rentrée 2026, j'entre en master d'ingénierie de l'intelligence artificielle à Paris 8, tout en poursuivant l'alternance. Ce que je cherche n'a pas changé depuis les sciences cognitives : rendre manipulable ce qui sert à décider.",
        en: "In autumn 2026 I start a master's in AI engineering at Paris 8, while continuing the apprenticeship. What I am after has not changed since cognitive science: making the things decisions rest on something people can actually handle.",
      },
    ],
  },

  travaux: { fr: "Travaux", en: "Work" },
} as const;

/* -------------------------------------------------------------------------- */
/* Travaux (liste)                                                             */
/* -------------------------------------------------------------------------- */

export const PAGE_TRAVAUX = {
  meta: {
    titre: { fr: "Travaux", en: "Work" },
    description: {
      fr: "Simulateurs de prospective portés d'Excel vers le navigateur, pipelines de données à grande échelle et systèmes de recherche augmentée.",
      en: "Foresight simulators ported from Excel to the browser, large-scale data pipelines and retrieval-augmented search systems.",
    },
  } satisfies Meta,
  titre: { fr: "Travaux", en: "Work" },
  chapeau: {
    fr: "Quatre chantiers, un même geste : prendre un modèle enfermé dans un outil que peu de gens peuvent ouvrir, et le rendre manipulable par tous, sans perdre en fidélité.",
    en: "Four projects, one same move: take a model locked inside a tool few people can open, and make it something anyone can handle, without losing fidelity.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Méthode                                                                     */
/* -------------------------------------------------------------------------- */

export const PAGE_METHODE = {
  meta: {
    titre: { fr: "Méthode", en: "Method" },
    description: {
      fr: "Comment je travaille avec des agents de code : ce que je leur délègue, ce que je garde, et comment je vérifie.",
      en: "How I work with coding agents: what I hand over, what I keep, and how I verify.",
    },
  } satisfies Meta,
  titre: {
    fr: "J'écris du code avec des agents. Voici où passe la frontière.",
    en: "I write code with agents. Here is where the line sits.",
  },
  chapeau: {
    fr: "L'historique de mes dépôts le montre sans détour : une partie du code a été produite avec un agent. Plutôt que de le taire, autant expliquer comment, parce que c'est la répartition des rôles qui décide de la qualité du résultat, pas l'outil.",
    en: "My commit history shows it plainly: part of this code was produced with an agent. Rather than keep quiet about it, better to explain how, because what decides the quality of the result is the division of labour, not the tool.",
  },
  blocs: [
    {
      titre: { fr: "Ce que je délègue", en: "What I hand over" },
      paragraphes: [
        {
          fr: "Le volume et la répétition. Porter 106 lignes d'un tableau d'experts dans une structure de données, écrire le septième composant de graphe sur le même patron, dérouler un refactor mécanique à travers neuf modules, produire un premier jet de documentation à partir du code.",
          en: "Volume and repetition. Porting 106 rows of an expert table into a data structure, writing the seventh chart component on the same pattern, rolling a mechanical refactor through nine modules, producing a first draft of documentation from the code.",
        },
        {
          fr: "Ce sont des tâches où l'erreur est visible et le coût de vérification faible. C'est exactement là qu'un agent est rentable.",
          en: "These are tasks where mistakes are visible and verification is cheap. That is exactly where an agent pays for itself.",
        },
      ],
    },
  ],
  garde: {
    titre: { fr: "Ce que je ne délègue pas", en: "What I never hand over" },
    items: [
      {
        titre: {
          fr: "La définition de ce qui est juste",
          en: "Defining what counts as correct",
        },
        corps: {
          fr: "Décider qu'un champ vide signifie « suivre le tendanciel » et non « zéro » n'est pas une question de code : c'est une lecture du modèle métier. Se tromper là produit un logiciel qui fonctionne parfaitement et répond faux.",
          en: "Deciding that an empty field means «follow the baseline trend» and not «zero» is not a coding question: it is a reading of the domain model. Getting it wrong produces software that works perfectly and answers wrongly.",
        },
      },
      {
        titre: {
          fr: "Le choix des invariants à vérifier",
          en: "Choosing which invariants to check",
        },
        corps: {
          fr: "Un agent écrit volontiers le test qu'on lui demande. Savoir que le test qui compte est la comparaison feuille à feuille avec le classeur d'origine, et fixer le seuil d'échec à 0,1 %, relève du jugement, pas de la génération.",
          en: "An agent will happily write the test you ask for. Knowing that the test that matters is the sheet-by-sheet comparison against the source workbook, and setting the failure threshold at 0.1%, is judgement, not generation.",
        },
      },
      {
        titre: { fr: "Les arbitrages contraints", en: "Trade-offs forced by the ground" },
        corps: {
          fr: "Renoncer à un bundler parce que le livrable doit s'ouvrir hors ligne depuis une pièce jointe : c'est une décision qui vient du terrain, pas des bonnes pratiques générales.",
          en: "Giving up a bundler because the deliverable has to open offline from an email attachment: that decision comes from the field, not from general best practice.",
        },
      },
      {
        titre: {
          fr: "La relecture ligne à ligne de ce qui part en production",
          en: "Reading line by line whatever ships",
        },
        corps: {
          fr: "Je ne valide pas un diff que je ne saurais pas défendre. Si je ne peux pas expliquer pourquoi une ligne est là, elle n'y reste pas.",
          en: "I do not approve a diff I could not defend. If I cannot explain why a line is there, it does not stay.",
        },
      },
    ],
  },
  verification: {
    titre: { fr: "Comment je vérifie", en: "How I verify" },
    paragraphes: [
      {
        fr: "La question posée à un agent n'est jamais « est-ce que ça marche ? », mais « comment saurai-je que ça a cessé de marcher ? ». Sur les simulateurs, la réponse tient dans le générateur de données : il rejoue les trajectoires de référence avec le modèle porté en JavaScript, les compare aux sorties du classeur, et refuse de produire le jeu de données au-delà de 0,1 % d'écart.",
        en: "The question I put to an agent is never «does this work?» but «how will I know when it has stopped working?». For the simulators, the answer lives in the data generator: it replays the reference trajectories through the JavaScript port, compares them against the workbook's outputs, and refuses to emit the dataset past 0.1% drift.",
      },
      {
        fr: "C'est ce garde-fou, et pas la revue de code, qui garantit que le simulateur et le classeur ne diront jamais deux choses différentes. Écart constaté en pratique : 0,00002 %.",
        en: "It is that guardrail, not code review, that guarantees the simulator and the workbook will never say two different things. Drift observed in practice: 0.00002%.",
      },
    ],
  },
  pourquoi: {
    titre: { fr: "Pourquoi le dire", en: "Why say it at all" },
    paragraphes: [
      {
        fr: "Parce que la compétence a changé de place. Produire du code n'est plus le goulet d'étranglement ; savoir ce qu'il faut produire, comment le contraindre et à quoi le confronter, si.",
        en: "Because the skill has moved. Producing code is no longer the bottleneck; knowing what to produce, how to constrain it and what to test it against, is.",
      },
      {
        fr: "Un portfolio qui masquerait cette part du travail décrirait un métier qui n'existe plus tout à fait.",
        en: "A portfolio that hid this part of the work would be describing a job that no longer quite exists.",
      },
    ],
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Making-of                                                                   */
/* -------------------------------------------------------------------------- */

export const PAGE_MAKING_OF = {
  meta: {
    titre: { fr: "Making-of", en: "Making-of" },
    description: {
      fr: "Comment ce portfolio est construit : architecture, budget de performance, arbitrages techniques et ce qui a été mesuré.",
      en: "How this portfolio is built: architecture, performance budget, technical trade-offs and what was actually measured.",
    },
  } satisfies Meta,
  titre: { fr: "Comment ce site est construit", en: "How this site is built" },
  chapeau: {
    fr: "Un portfolio qui prétend savoir faire tenir de la donnée lourde dans un navigateur doit pouvoir être ouvert et vérifié. Voici l'architecture, le budget que je me suis fixé, et les arbitrages que j'ai tranchés contre mon plan initial.",
    en: "A portfolio that claims it can fit heavy data inside a browser had better be open to inspection. Here is the architecture, the budget I set myself, and the trade-offs I settled against my own initial plan.",
  },
  /*
   * Ces quatre nombres sont comptés, pas estimés. Le jour où l'un d'eux devient
   * faux, c'est toute la page qui perd son autorité : elle n'a d'intérêt que
   * parce qu'elle est vérifiable.
   */
  mesures: [
    {
      valeur: "34",
      libelle: { fr: "pages statiques", en: "static pages" },
      note: { fr: "dix-sept, dans deux langues", en: "seventeen, in two languages" },
    },
    {
      valeur: "1",
      libelle: { fr: "point serveur", en: "server endpoint" },
      note: { fr: "et il est facultatif", en: "and it is optional" },
    },
    {
      valeur: "150",
      libelle: { fr: "tests", en: "tests" },
      note: { fr: "sur les vrais vecteurs du build", en: "against the build's real vectors" },
    },
    {
      valeur: "37",
      libelle: { fr: "vérifications visuelles", en: "visual checks" },
      note: { fr: "captures, géométrie et densité", en: "screenshots, geometry and density" },
    },
  ],
  principe: {
    titre: { fr: "Le principe", en: "The principle" },
    paragraphes: [
      {
        fr: "Tout le contenu est du HTML généré au build. Le site se lit intégralement sans JavaScript, sans WebGL et sans WebAssembly. C'est la seule façon de tenir à la fois l'accessibilité, le référencement et un premier rendu rapide.",
        en: "All the content is HTML generated at build time. The site reads in full without JavaScript, without WebGL and without WebAssembly. That is the only way to hold accessibility, search indexing and a fast first paint at the same time.",
      },
      {
        fr: "Les moteurs viennent par-dessus, et seulement à la demande. Ouvrir la console télécharge DuckDB ; poser une question télécharge le modèle de vectorisation. Un visiteur qui vient lire trois paragraphes ne paie ni l'un ni l'autre.",
        en: "The engines sit on top, and only on demand. Opening the console downloads DuckDB; asking a question downloads the embedding model. A visitor who came to read three paragraphs pays for neither.",
      },
    ],
  },
  budget: {
    titre: { fr: "Le budget", en: "The budget" },
    chapeau: {
      fr: "La contrainte structurante du site tient en une phrase : les moteurs ne doivent jamais entrer dans le lot initial. Ce n'est pas une intention, c'est une assertion vérifiée en intégration continue.",
      en: "The site's structuring constraint fits in one sentence: the engines must never enter the initial bundle. That is not an intention, it is an assertion checked in continuous integration.",
    },
    etages: [
      {
        titre: { fr: "Étage 0 — immédiat", en: "Tier 0 — immediate" },
        corps: {
          fr: "HTML, CSS, police, portrait. Le site complet.",
          en: "HTML, CSS, fonts, portrait. The whole site.",
        },
      },
      {
        titre: { fr: "Étage 1 — à la demande", en: "Tier 1 — on demand" },
        corps: {
          fr: "DuckDB-WASM, à l'ouverture de la console.",
          en: "DuckDB-WASM, when the console opens.",
        },
      },
      {
        titre: { fr: "Étage 2 — à la demande", en: "Tier 2 — on demand" },
        corps: {
          fr: "Modèle de vectorisation, à la première question.",
          en: "The embedding model, on the first question asked.",
        },
      },
    ],
  },
  arbitrages: [
    {
      titre: {
        fr: "L'agent tourne sans modèle par défaut",
        en: "The agent runs without a model by default",
      },
      corps: {
        fr: "La console offrait trois outils actionnés à la main : aller à une page, écrire du SQL, interroger le corpus. L'agent n'en reçoit pas un quatrième, il reçoit une boucle. Il pouvait n'exister qu'en appelant un modèle, et il aurait alors disparu le jour où la clé manque, où le quota tombe ou où le fournisseur a une mauvaise heure. Il tourne donc par défaut sur un planificateur déterministe, entièrement dans le navigateur : une grammaire d'intentions figée, quatre plans possibles, aucun coût. Le modèle s'ajoute quand une clé est présente et comprend des tournures que la grammaire ignore. En cas de panne au troisième tour, le déterministe reprend la trace en cours sans la perdre, parce qu'il lit les observations au lieu de tenir son propre état. Le panneau affiche lequel a servi.",
        en: "The console offered three tools driven by hand: go to a page, write SQL, query the corpus. The agent gets no fourth one, it gets a loop. It could have existed only by calling a model, and would then have vanished the day the key is missing, the quota runs out, or the provider has a bad hour. So it runs by default on a deterministic planner, entirely in the browser: a fixed grammar of intents, four possible plans, no cost. The model is added when a key is present and understands phrasings the grammar ignores. If it fails on the third turn, the deterministic planner picks the running trace back up without losing it, because it reads the observations rather than holding its own state. The panel shows which one served.",
      },
    },
    {
      titre: {
        fr: "Le modèle décide, le navigateur agit",
        en: "The model decides, the browser acts",
      },
      corps: {
        fr: "Même en régime modèle, aucun outil ne s'exécute sur le serveur. DuckDB interroge une base locale, le corpus est vectorisé sur la machine du visiteur, la navigation est un changement de route côté client. La route serveur reçoit la question et le résumé des observations déjà faites, et renvoie un seul choix d'outil. Ce partage a une conséquence pratique qui vaut plus que son élégance : les deux régimes exécutent exactement le même code d'outil, donc une trace obtenue avec le modèle et une trace obtenue sans se comparent ligne à ligne. Et ce qu'un modèle propose n'est jamais exécuté sans validation : une cible de navigation est comparée à la liste des pages construite depuis le contenu, une requête non lecture est refusée, et un nom d'outil hors des quatre fait basculer sur le repli.",
        en: "Even in model mode, no tool runs on the server. DuckDB queries a local database, the corpus is embedded on the visitor's machine, navigation is a client-side route change. The server route receives the question and a summary of the observations already made, and returns a single tool choice. That split has a practical consequence worth more than its elegance: both modes run exactly the same tool code, so a trace obtained with the model and one obtained without compare line by line. And nothing a model proposes is executed unchecked: a navigation target is matched against the page list built from the content, a non-read query is refused, and a tool name outside the four triggers the fallback.",
      },
    },
    {
      titre: {
        fr: "Toute la direction artistique refaite après coup",
        en: "The whole art direction redone after the fact",
      },
      corps: {
        fr: "La première version de ce site a été dessinée sans que personne ne la regarde : encre presque noire, une seule couleur d'accent, et un style d'étiquette en monospace capitales appliqué partout, jusque dans la navigation et les pieds de page. À cette fréquence, ce style ne renseigne plus, il crie. Le résultat était froid et vide, et la seule façon de le savoir était de le montrer. La refonte remplace l'accent unique par trois couleurs qui se relaient, rend la casse aux étiquettes, réserve le monospace aux données, et fait porter le contraste par la masse typographique plutôt que par la couleur.",
        en: "The first version of this site was designed without anyone ever looking at it: near-black ink, a single accent colour, and a monospace all-caps label style applied everywhere, navigation and footers included. At that frequency the style stops informing and starts shouting. The result was cold and empty, and the only way to find that out was to render it. The redesign replaces the single accent with three colours that take turns, gives labels their casing back, reserves monospace for data, and lets typographic mass carry the contrast instead of colour.",
      },
    },
    {
      titre: {
        fr: "Une figure qui montre le moteur, à la place d'un globe",
        en: "A figure that shows the engine, instead of a globe",
      },
      corps: {
        fr: "La page d'accueil portait un globe de points et d'arcs, décoratif et assumé comme tel. Il occupait la place la plus visible du site pour ne rien démontrer. Il est remplacé par la projection du corpus vectorisé : les passages que le moteur de recherche compare réellement à votre question, réduits de 384 dimensions à deux par analyse en composantes principales. La part de variance conservée est affichée, parce qu'une projection qui ne dit pas ce qu'elle perd est une illustration, pas une mesure.",
        en: "The home page carried a globe of points and arcs, decorative and openly so. It occupied the most visible spot on the site while demonstrating nothing. It has been replaced by a projection of the embedded corpus: the passages the search engine actually compares against your question, reduced from 384 dimensions to two by principal component analysis. The share of variance retained is displayed, because a projection that does not say what it loses is an illustration, not a measurement.",
      },
    },
    {
      titre: {
        fr: "Pas de Parquet pour le contenu du site",
        en: "No Parquet for the site's own content",
      },
      corps: {
        fr: "Le contenu du portfolio tient en une centaine de lignes et douze kilo-octets. Un format colonnaire compressé n'y rend aucun service : il ajoute une dépendance d'écriture, une étape de build et un binaire opaque pour économiser quelques kilo-octets sur un fichier qui n'est chargé que si l'on ouvre la console. DuckDB lit donc du JSON. Parquet garde sa place là où il en a une : dans le pipeline de commerce international, sur des millions de lignes.",
        en: "The portfolio's content is about a hundred rows and twelve kilobytes. A compressed columnar format does it no favours: it adds a writing dependency, a build step and an opaque binary in order to save a few kilobytes on a file that only loads if you open the console. So DuckDB reads JSON. Parquet keeps its place where it has one: in the international-trade pipeline, over millions of rows.",
      },
    },
    {
      titre: {
        fr: "DuckDB servi depuis un CDN, pas depuis le dépôt",
        en: "DuckDB served from a CDN, not from the repository",
      },
      corps: {
        fr: "Les binaires WebAssembly de DuckDB pèsent entre 34 et 40 Mo selon la variante, et il en faut deux pour couvrir tous les navigateurs. Les verser dans le dépôt ferait 75 Mo pour une fonctionnalité facultative. Le CDN officiel du projet est la seule dépendance externe du site ; elle ne concerne que la console, et son échec est rattrapé sans casser la page.",
        en: "DuckDB's WebAssembly binaries weigh between 34 and 40 MB depending on the variant, and two are needed to cover every browser. Committing them would mean 75 MB for an optional feature. The project's official CDN is the site's only external dependency; it concerns the console alone, and its failure is caught without breaking the page.",
      },
    },
    {
      titre: {
        fr: "Un autre modèle de vectorisation que celui du projet d'origine",
        en: "A different embedding model from the original project's",
      },
      corps: {
        fr: "Le moteur de recherche est le portage web de mon projet Python, qui emploie all-MiniLM-L6-v2. Ce modèle est entraîné très majoritairement sur de l'anglais. Mesuré sur ce corpus français, il rendait quatre passages sans rapport entre eux dans un intervalle de score de 0,02 : à cet écart, le classement ne veut plus rien dire. La version multilingue sépare réellement les passages. La fidélité au projet d'origine ne valait pas une recherche qui classe mal.",
        en: "The search engine is the web port of my Python project, which uses all-MiniLM-L6-v2. That model is trained overwhelmingly on English. Measured against this French corpus, it returned four unrelated passages within a score range of 0.02: at that spread, the ranking means nothing. The multilingual version genuinely separates the passages. Fidelity to the original project was not worth a search that ranks badly.",
      },
    },
    {
      titre: {
        fr: "Les domaines dans un passage court et séparé",
        en: "Domains in a short, separate passage",
      },
      corps: {
        fr: "Poser « a-t-il travaillé sur de l'intelligence artificielle ? » ne remontait aucun projet : le texte du projet de recherche augmentée parle de vectorisation et de similarité cosinus, jamais d'« intelligence artificielle ». Ajouter les domaines au résumé n'a rien changé, parce que la mise en commun par moyenne dilue une expression courte dans un passage long. Isolée dans une phrase brève, la même information fait passer le projet du huitième au premier rang.",
        en: "Asking «has he worked on artificial intelligence?» surfaced no project at all: the text of the retrieval-augmented project talks about embeddings and cosine similarity, never about «artificial intelligence». Adding the domains to the summary changed nothing, because mean pooling dilutes a short phrase inside a long passage. Isolated in one brief sentence, the same information moves the project from eighth place to first.",
      },
    },
  ],
  verifie: {
    titre: { fr: "Ce qui est vérifié", en: "What is checked" },
    paragraphes: [
      {
        fr: "Les tests portent sur ce qui casse en silence. Que le binaire des vecteurs corresponde aux métadonnées. Que le modèle inscrit dans le corpus soit celui que le navigateur chargera, sinon questions et passages vivraient dans deux espaces différents et la similarité ne mesurerait plus rien. Que les extraits affichés soient bien ceux qui ont été vectorisés. Qu'aucune source ne monopolise un classement.",
        en: "The tests cover what breaks silently. That the vector binary matches its metadata. That the model recorded in the corpus is the one the browser will load, because otherwise questions and passages would live in two different spaces and similarity would measure nothing at all. That the excerpts displayed are the ones that were actually embedded. That no single source monopolises a ranking.",
      },
      {
        fr: "Et une vérification qui n'est pas technique : un script relit tout ce qui part en ligne contre douze motifs interdits, pour que les travaux menés en alternance restent anonymes. Il tourne avant le build, et son échec arrête tout.",
        en: "And one check that is not technical: a script reads everything about to go online against twelve forbidden patterns, so that the apprenticeship work stays anonymous. It runs before the build, and its failure stops everything.",
      },
      {
        fr: "Reste ce qu'aucun test unitaire ne voit : une couleur qui change, un titre qui déborde, une grille qui s'effondre. Vingt et une captures sont donc comparées pixel à pixel à des images de référence versionnées. Ce filet a servi dès sa pose : il a montré que les quatre simulations du labo restaient vides pour quiconque demande à son système de réduire les animations, un défaut qui ne lève aucune erreur et que personne n'aurait vu.",
        en: "That leaves what no unit test can see: a colour that shifts, a heading that overflows, a grid that collapses. Twenty-one screenshots are therefore compared pixel by pixel against versioned reference images. The net caught something the moment it was hung: the lab's four simulations were rendering blank for anyone who asks their system to reduce motion, a defect that raises no error and that nobody would have noticed.",
      },
    ],
  },
  pied: {
    fr: "Le détail des projets se lit dans les travaux, et la façon dont je travaille dans la méthode.",
    en: "The projects are detailed under work, and the way I work under method.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Labo                                                                        */
/* -------------------------------------------------------------------------- */

export const PAGE_LABO = {
  meta: {
    titre: { fr: "Labo", en: "Lab" },
    description: {
      fr: "Simulations interactives : rétropropagation écrite à la main, comportements émergents, k-moyennes itératif, systèmes temps réel jouables.",
      en: "Interactive simulations: hand-written backpropagation, emergent behaviour, iterative k-means, playable real-time systems.",
    },
  } satisfies Meta,
  titre: { fr: "Labo", en: "Lab" },
  chapeau: {
    fr: "Des systèmes qu'on ne comprend qu'en les faisant tourner. Tout ce qui suit s'exécute dans votre navigateur, en canvas, sans bibliothèque : quelques centaines de lignes chacun, et rien de pré-calculé.",
    en: "Systems you only understand by running them. Everything below executes in your browser, on a canvas, with no library: a few hundred lines each, and nothing pre-computed.",
  },
  note: {
    fr: "Les simulations se mettent en pause dès qu'elles sortent du champ, et restent fixes si votre système demande à réduire les animations.",
    en: "The simulations pause as soon as they scroll out of view, and stay still if your system asks for reduced motion.",
  },
  demos: {
    reseau: {
      titre: { fr: "Un réseau qui apprend", en: "A network that learns" },
      sousTitre: {
        fr: "Rétropropagation écrite à la main, sans bibliothèque",
        en: "Backpropagation written by hand, with no library",
      },
      corps: [
        {
          fr: "La forme est tirée au sort à chaque visite, parmi six : deux lunes, des bandes, des spirales, des anneaux, quatre amas en OU exclusif, un damier. Le réseau, lui, ne change pas d'un paramètre — deux entrées, deux couches cachées de douze neurones, une sortie. C'est ce qui rend la démonstration crédible : montrer toujours la même figure ne prouverait que le réglage sur mesure.",
          en: "The shape is drawn at random on every visit, from six: two moons, stripes, spirals, rings, four exclusive-or clusters, a checkerboard. The network itself does not change by a single parameter — two inputs, two hidden layers of twelve neurons, one output. That is what makes the demo credible: always showing the same figure would only prove it had been tuned for that figure.",
        },
        {
          fr: "Sous le cadre, deux nombres à lire ensemble. Le plafond linéaire est la justesse du meilleur demi-plan possible sur ces points-là, calculée exactement à l'orientation près, pas estimée : il va de 88 % sur deux lunes à 62 % sur un damier. La justesse, c'est celle du réseau. L'écart entre les deux est la seule mesure honnête de ce que le non-linéaire apporte, et il change à chaque forme.",
          en: "Below the frame, two numbers to read together. The linear ceiling is the accuracy of the best possible half-plane on those exact points, computed exactly up to the orientation step rather than estimated: it runs from 88% on two moons to 62% on a checkerboard. The accuracy is the network's. The gap between the two is the only honest measure of what the non-linear part buys you, and it changes with every shape.",
        },
        {
          fr: "Passe avant, passe arrière, descente de gradient sur mini-lots : tout est écrit à la main, en une centaine de lignes, sans TensorFlow ni PyTorch. C'est le même parti pris que mon projet de recherche augmentée : on ne comprend un mécanisme qu'en l'implémentant, et l'entropie croisée binaire combinée à une sigmoïde donne directement la dérivée de sortie, sans passer par la dérivée de l'activation.",
          en: "Forward pass, backward pass, mini-batch gradient descent: all written by hand, in about a hundred lines, with no TensorFlow and no PyTorch. Same stance as my retrieval-augmented project: you only understand a mechanism by implementing it, and binary cross-entropy combined with a sigmoid gives the output derivative directly, without going through the activation's derivative.",
        },
        {
          fr: "Basculez sur « Dessiner » et posez vos propres points : vous choisissez la couleur, vous cliquez dans le cadre, et la frontière s'adapte à ce que vous venez de tracer. Le plafond linéaire se recalcule à chaque point, ce qui rend visible une chose difficile à croire sur parole : deux ou trois points suffisent à faire tomber un problème de séparable à impossible. C'est là qu'on apprend le plus. Un seul point mal placé déforme toute une frontière, et le réseau extrapole n'importe quoi là où vous ne lui avez rien montré.",
          en: "Switch to «Draw» and place your own points: pick a colour, click inside the frame, and the boundary adapts to what you just drew. The linear ceiling recomputes on every point, which makes visible something hard to take on trust: two or three points are enough to turn a separable problem into an impossible one. That is where you learn the most. One badly placed point deforms an entire boundary, and the network extrapolates nonsense wherever you showed it nothing.",
        },
        {
          fr: "Le bogue qui m'a coûté le plus de temps ici n'était ni dans les gradients ni dans l'architecture : les points étaient générés classe par classe, et un parcours séquentiel produisait des mini-lots presque mono-classe. Le réseau apprenait alternativement « tout est 0 » puis « tout est 1 » et s'effondrait à 50 %. Un mélange de Fisher-Yates a suffi. C'est le genre de défaut qu'aucune relecture ne montre et qu'une mesure trouve en dix minutes.",
          en: "The bug that cost me the most time here was neither in the gradients nor in the architecture: the points were generated class by class, and walking them sequentially produced almost single-class mini-batches. The network alternately learned «everything is 0» then «everything is 1» and collapsed to 50%. A Fisher-Yates shuffle was enough. This is the kind of defect no code review reveals and a measurement finds in ten minutes.",
        },
      ],
    },
    nuee: {
      titre: { fr: "Nuée", en: "Flock" },
      sousTitre: {
        fr: "Comportement émergent à partir de trois règles locales",
        en: "Emergent behaviour from three local rules",
      },
      corps: [
        {
          fr: "Séparation, alignement, cohésion. Chaque individu ne perçoit que ses voisins immédiats et n'a aucune idée de la forme du groupe : celle-ci n'est écrite nulle part, elle apparaît.",
          en: "Separation, alignment, cohesion. Each individual perceives only its immediate neighbours and has no idea what shape the group has: that shape is written nowhere, it appears.",
        },
        {
          fr: "C'est le contre-exemple le plus court à l'intuition qu'un comportement collectif lisible demande une coordination centrale. Le curseur fait office de prédateur.",
          en: "It is the shortest counter-example to the intuition that legible collective behaviour requires central coordination. Your cursor plays the predator.",
        },
        {
          fr: "La couleur n'indique pas la vitesse mais le nombre de voisins perçus : un individu passe au citron dès qu'il en compte quatre. On voit ainsi les agrégats se former et se défaire, ce qui est précisément la grandeur que la démonstration prétend illustrer.",
          en: "Colour does not track speed but the number of neighbours perceived: an individual turns lemon as soon as it counts four. You watch clusters form and break up, which is exactly the quantity this demo claims to illustrate.",
        },
      ],
    },
    kmoyennes: {
      titre: { fr: "k-moyennes", en: "k-means" },
      sousTitre: {
        fr: "La convergence, montrée itération par itération",
        en: "Convergence, shown one iteration at a time",
      },
      corps: [
        {
          fr: "L'algorithme de Lloyd tient en deux gestes répétés : affecter chaque point au centre le plus proche, puis déplacer chaque centre au barycentre de ce qu'il a récolté. La démonstration les exécute lentement et affiche l'inertie, pour donner à voir la convergence plutôt que son résultat.",
          en: "Lloyd's algorithm is two repeated moves: assign each point to the nearest centre, then move each centre to the barycentre of what it collected. The demo runs them slowly and displays the inertia, to show convergence rather than its result.",
        },
        {
          fr: "L'initialisation est volontairement naïve, des points tirés au hasard. C'est elle qui rend visible le minimum local que k-means++ existe pour éviter. Cliquez pour ajouter un point : un seul, mal placé, suffit parfois à déplacer une frontière.",
          en: "The initialisation is deliberately naive, points drawn at random. That is what makes visible the local minimum k-means++ exists to avoid. Click to add a point: one badly placed point is sometimes enough to move a boundary.",
        },
      ],
    },
    agar: {
      titre: { fr: "Agar", en: "Agar" },
      sousTitre: {
        fr: "Un système jouable, tenu par un seul compromis",
        en: "A playable system, held together by a single trade-off",
      },
      corps: [
        {
          fr: "Reprise de mon dépôt `agar`, porté en canvas. La cellule suit le curseur, absorbe ce qui est plus petit qu'elle, se fait absorber par le reste.",
          en: "Taken from my `agar` repository and ported to canvas. The cell follows the cursor, absorbs whatever is smaller than it, and is absorbed by everything else.",
        },
        {
          fr: "Toute la tension du jeu tient dans une ligne de code : la vitesse décroît avec la masse. Grossir, c'est gagner en portée et perdre en fuite. Sans ce compromis, il n'y a plus de partie, seulement une courbe croissante.",
          en: "The whole tension of the game sits in one line of code: speed decreases with mass. Growing means gaining reach and losing escape. Without that trade-off there is no game, only an increasing curve.",
        },
      ],
    },
    politique: {
      titre: { fr: "Une politique qui apprend à jouer", en: "A policy that learns to play" },
      sousTitre: {
        fr: "Gradient de politique, contre la règle écrite juste au-dessus",
        en: "Policy gradient, against the rule written just above",
      },
      corps: [
        {
          fr: "Le réseau du haut de page apprend une frontière : on lui montre la bonne réponse pour chaque point, il ajuste. Ici, personne ne connaît la bonne réponse. Il n'existe qu'une récompense qui arrive après coup, et tout le problème est d'attribuer le mérite d'un gain à une décision prise trois secondes plus tôt. C'est la différence entre apprendre à classer et apprendre à agir.",
          en: "The network at the top of this page learns a boundary: you show it the right answer for each point, it adjusts. Here, nobody knows the right answer. There is only a reward that arrives afterwards, and the whole problem is crediting a gain to a decision taken three seconds earlier. That is the difference between learning to classify and learning to act.",
        },
        {
          fr: "L'agent joue dans le monde du jeu ci-dessus, sous les mêmes règles, importées du même fichier. Autour de lui, la rose des vents affiche sa distribution sur les huit directions : c'est sa décision, pas son résultat. Au premier épisode les huit branches sont égales, il titube et se fait absorber en deux secondes. En dessous, invisible, l'entraînement joue quelques centaines d'épisodes par seconde.",
          en: "The agent plays in the world of the game above, under the same rules, imported from the same file. Around it, the compass shows its distribution over the eight directions: that is its decision, not its outcome. On the first episode the eight spokes are equal, it staggers and gets absorbed in two seconds. Underneath, invisible, training plays a few hundred episodes per second.",
        },
        {
          fr: "Les trois barres sont la raison d'être de la démonstration, comme le plafond linéaire l'est pour le réseau. « L'agent survit onze secondes » ne dit rien tant qu'on ignore ce que valent le hasard et une bonne règle écrite à la main sur le même problème. Le hasard tient 1,9 s. L'heuristique qui pilote les rivaux du jeu, contrainte aux mêmes huit directions, tient 7,6 s. Mesurée sur huit graines après 4 000 épisodes, la politique apprise atteint 11,0 s de médiane, et dépasse l'heuristique sur six graines sur huit.",
          en: "The three bars are the point of the whole demo, the way the linear ceiling is for the network. «The agent survives eleven seconds» says nothing until you know what random play and a good hand-written rule are worth on the same problem. Random lasts 1.9 s. The heuristic that drives the game's rivals, constrained to the same eight directions, lasts 7.6 s. Measured over eight seeds after 4,000 episodes, the learned policy reaches a median of 11.0 s, and beats the heuristic on six seeds out of eight.",
        },
        {
          fr: "Deux graines sur huit, donc, où elle reste en dessous. C'est la propriété la plus honnête de cette famille d'algorithmes et la plus souvent tue : le résultat dépend du tirage initial, et rapporter la meilleure exécution plutôt que la médiane est le péché ordinaire du domaine. Le bouton « Repartir de zéro » tire une nouvelle graine, et il arrive que la courbe stagne.",
          en: "So two seeds out of eight where it stays below. That is the most honest property of this family of algorithms, and the one most often left unsaid: the result depends on the initial draw, and reporting the best run rather than the median is the field's ordinary sin. The «Start over» button draws a new seed, and sometimes the curve just stalls.",
        },
        {
          fr: "Ce qu'elle finit par trouver et que la règle écrite ignore, c'est le mur. Sur 300 parties, 51 % des morts de l'heuristique surviennent à moins de 40 pixels d'un bord, contre 30 % attendus si la position n'y était pour rien : fuir en ligne droite devant une menace revient à se laisser acculer. La position dans le cadre fait partie des douze nombres que l'agent perçoit, et il apprend à s'en servir sans qu'on lui ait dit à quoi ils correspondent.",
          en: "What it eventually finds, and the written rule ignores, is the wall. Over 300 games, 51% of the heuristic's deaths happen within 40 pixels of an edge, against 30% expected if position had nothing to do with it: fleeing in a straight line from a threat means letting yourself be cornered. Position within the frame is among the twelve numbers the agent perceives, and it learns to use them without ever being told what they mean.",
        },
        {
          fr: "Le réglage qui décide de tout est la prime d'entropie, qui paie la politique pour rester indécise. Sans elle, mesurée après 4 000 épisodes, l'entropie de la distribution tombe à 0,002 sur un maximum de 2,08 : l'agent devient certain de son choix partout, cesse d'explorer et se fige sur ce qu'il avait trouvé au millier d'épisodes. À 0,08 la courbe monte et tient. À 0,20 la prime domine la récompense et il ne se décide jamais.",
          en: "The setting that decides everything is the entropy bonus, which pays the policy to stay undecided. Without it, measured after 4,000 episodes, the distribution's entropy falls to 0.002 out of a maximum of 2.08: the agent becomes certain of its choice everywhere, stops exploring, and freezes on whatever it had found by a thousand episodes. At 0.08 the curve climbs and holds. At 0.20 the bonus dominates the reward and it never makes up its mind.",
        },
        {
          fr: "Six cent seize paramètres, la passe avant et la passe arrière écrites à la main comme pour le réseau du haut, et l'entraînement étalé sur les images plutôt qu'exécuté en bloc : un épisode coûte d'autant plus cher que l'agent joue bien, ce qui ferait sauter l'affichage exactement au moment où ça devient intéressant. L'environnement, lui, pesait 85 % du coût d'un pas. Comparer les distances au carré et sortir les rayons des boucles l'a divisé par deux et demi, sans changer un seul résultat.",
          en: "Six hundred and sixteen parameters, forward and backward passes written by hand as for the network above, and training spread across frames rather than run in blocks: an episode costs more the better the agent plays, which would stall the display exactly when it gets interesting. The environment itself accounted for 85% of a step's cost. Comparing squared distances and hoisting the radii out of the loops divided that by two and a half, without changing a single result.",
        },
      ],
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Parcours                                                                    */
/* -------------------------------------------------------------------------- */

export const PAGE_PARCOURS = {
  meta: {
    titre: { fr: "Parcours", en: "Background" },
    description: {
      fr: "Formation, alternance et compétences d'Esteban Beretti-Prenant.",
      en: "Esteban Beretti-Prenant's education, apprenticeship and skills.",
    },
  } satisfies Meta,
  titre: { fr: "Parcours", en: "Background" },
  chapeau: {
    fr: "En alternance dans un institut de recherche public, où je porte des modèles de prospective vers le web. Entrée en master d'ingénierie de l'IA à la rentrée 2026.",
    en: "Apprentice at a public research institute, where I port foresight models to the web. Starting a master's in AI engineering in autumn 2026.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const PAGE_CONTACT = {
  meta: {
    titre: { fr: "Contact", en: "Contact" },
    description: {
      fr: "Pour échanger sur la donnée, les modèles ou un projet.",
      en: "To talk about data, models, or a project.",
    },
  } satisfies Meta,
  titre: { fr: "Parlons-en.", en: "Let's talk." },
  chapeau: {
    fr: "Je ne cherche pas de poste, je suis en alternance et j'y reste. Mais si vous travaillez sur de la prospective, de la donnée lourde à rendre lisible, ou sur ce qu'on peut faire tenir dans un navigateur sans serveur, j'ai probablement des choses à apprendre de vous, et peut-être une ou deux à raconter.",
    en: "I am not looking for a job: I have an apprenticeship and I am staying in it. But if you work on foresight, on heavy data that needs to be made legible, or on what can be made to fit inside a browser without a server, I probably have things to learn from you, and maybe one or two to tell.",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Démonstration                                                               */
/* -------------------------------------------------------------------------- */

export const PAGE_DEMONSTRATION = {
  meta: {
    titre: { fr: "Simulateur en démonstration", en: "Simulator demo" },
    description: {
      fr: "Une version publiable de l'un des simulateurs de prospective que j'ai construits : code et interface d'origine, données entièrement fabriquées.",
      en: "A publishable version of one of the foresight simulators I built: original code and interface, entirely fabricated data.",
    },
  } satisfies Meta,
  surTitre: {
    fr: "Essayez-le, ne me croyez pas sur parole",
    en: "Try it, don't take my word for it",
  },
  titre: { fr: "Un simulateur, en vrai", en: "A simulator, for real" },
  chapeau: {
    fr: "Voici l'un des quatre simulateurs de prospective décrits dans mes travaux, dans une version publiable. Sept onglets, cinq trajectoires, trente et une matières suivies de 2025 à 2050, et un mode libre où vous réglez vous-même les paramètres.",
    en: "Here is one of the four foresight simulators described in my work, in a publishable version. Seven tabs, five trajectories, thirty-one materials tracked from 2025 to 2050, and a free mode where you set the parameters yourself.",
  },
  avertissementTitre: { fr: "Les chiffres sont inventés", en: "The numbers are invented" },
  avertissement: {
    fr: "Le code, la mise en page, les graphiques et la chaîne de calcul sont ceux que j'ai écrits. Les données, non. Toutes les valeurs numériques ont été régénérées par un modèle de synthèse : les courbes sont plausibles, elles ne modélisent rien. Les sorties réelles appartiennent à mon employeur et ne sont pas publiables.",
    en: "The code, the layout, the charts and the calculation chain are the ones I wrote. The data is not. Every numeric value was regenerated by a synthetic model: the curves are plausible, they model nothing. The real outputs belong to my employer and cannot be published.",
  },
  donneesDemo: { fr: "Données de démonstration", en: "Demonstration data" },
  ouvrirPleinePage: { fr: "Ouvrir en pleine page ↗", en: "Open full page ↗" },
  titreIframe: {
    fr: "Simulateur de prospective numérique, en données de démonstration",
    en: "Digital-infrastructure foresight simulator, running on demonstration data",
  },
  commentTitre: {
    fr: "Comment cette version a été produite",
    en: "How this version was produced",
  },
  comment: [
    {
      fr: "Un script de neutralisation lit le dépôt privé et écrit cette version. Il conserve le code, les feuilles de style, les bibliothèques et les clés de structure : « Aluminium », « Smartphones », « Stock » sont du vocabulaire public, pas une information appartenant à quelqu'un.",
      en: "A neutralisation script reads the private repository and writes this version. It keeps the code, the stylesheets, the libraries and the structural keys: «Aluminium», «Smartphones», «Stock» are public vocabulary, not information belonging to anyone.",
    },
    {
      fr: "Il remplace en revanche l'intégralité des valeurs numériques, les noms de trajectoires, les territoires, les logos, les cartes, ainsi que la police et les couleurs du design system imposé, ce dernier étant à lui seul un indice d'appartenance.",
      en: "It does replace every numeric value, the trajectory names, the territories, the logos, the maps, and the typeface and colours of the mandated design system, which on its own would give the affiliation away.",
    },
    {
      fr: "Quatre défauts n'ont été trouvés qu'en ouvrant le résultat dans un navigateur : une règle de substitution mal ordonnée qui renommait un fichier sans renommer sa référence, laissant l'application réclamer un script inexistant ; un bloc-marque institutionnel encore affiché, qu'aucune substitution de chaîne ne pouvait retirer ; des polices renommées vers des fichiers absents ; et des images pointant sur un dossier vide. C'est la raison pour laquelle la vérification passe par un navigateur réel et non par une relecture.",
      en: "Four defects were only found by opening the result in a browser: a mis-ordered substitution rule that renamed a file without renaming its reference, leaving the application asking for a script that did not exist; an institutional brand block still on screen, which no string substitution could remove; fonts renamed to files that were absent; and images pointing at an empty folder. This is why verification goes through a real browser and not through a proofread.",
    },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* Bac à sable                                                                 */
/* -------------------------------------------------------------------------- */

export const PAGE_BAC_A_SABLE = {
  meta: {
    titre: { fr: "Bac à sable SQL", en: "SQL sandbox" },
    description: {
      fr: "Déposez un CSV ou un Parquet et interrogez-le en SQL dans votre navigateur. Aucun serveur, aucune donnée envoyée.",
      en: "Drop in a CSV or a Parquet file and query it in SQL inside your browser. No server, no data sent anywhere.",
    },
  } satisfies Meta,
  surTitre: { fr: "Un outil, pas une démonstration", en: "A tool, not a demo" },
  titre: { fr: "Vos données, votre navigateur", en: "Your data, your browser" },
  chapeau: {
    fr: "Déposez un fichier et interrogez-le en SQL. Un moteur analytique complet s'installe dans l'onglet, lit votre fichier depuis la mémoire, et répond sur place.",
    en: "Drop in a file and query it in SQL. A complete analytics engine installs itself in the tab, reads your file from memory, and answers on the spot.",
  },
  garantieTitre: { fr: "Aucun serveur au bout", en: "No server at the other end" },
  garantie: {
    fr: "Ce site est un ensemble de fichiers statiques : il n'y a littéralement pas de machine capable de recevoir vos données. Votre fichier ne franchit jamais l'onglet. Vous pouvez couper votre connexion après le chargement du moteur et continuer à travailler.",
    en: "This site is a set of static files: there is literally no machine capable of receiving your data. Your file never leaves the tab. You can cut your connection once the engine has loaded and keep working.",
  },
  pourquoiTitre: { fr: "Pourquoi cet outil existe", en: "Why this tool exists" },
  pourquoi: [
    {
      fr: "Analyser un fichier de plusieurs centaines de milliers de lignes se termine habituellement de deux façons : un tableur qui s'étrangle, ou un service en ligne auquel il faut confier ses données. Les deux sont de mauvaises réponses quand le fichier est volumineux et confidentiel, ce qui est le cas courant.",
      en: "Analysing a file of several hundred thousand rows usually ends one of two ways: a spreadsheet that chokes, or an online service you have to hand your data to. Both are bad answers when the file is large and confidential, which is the common case.",
    },
    {
      fr: "La troisième voie consiste à amener le moteur à la donnée plutôt que l'inverse. C'est le principe que j'emploie dans mon analyse des flux de minéraux critiques : vingt-cinq ans de déclarations douanières interrogées sans la moindre machine à maintenir. Cette page est le même mécanisme, ouvert à vos fichiers.",
      en: "The third path is to bring the engine to the data rather than the reverse. That is the principle behind my analysis of critical-mineral flows: twenty-five years of customs declarations queried without a single machine to maintain. This page is the same mechanism, opened up to your files.",
    },
    {
      fr: "Le moteur pèse une dizaine de méga-octets compressés, téléchargés une seule fois et uniquement si vous déposez quelque chose. Le reste du site ne le paie pas.",
      en: "The engine weighs around ten megabytes compressed, downloaded once and only if you drop something in. The rest of the site does not pay for it.",
    },
  ],
  lienComtrade: {
    fr: "mon analyse des flux de minéraux critiques",
    en: "my analysis of critical-mineral flows",
  },
} as const;

/* -------------------------------------------------------------------------- */
/* Notes                                                                       */
/* -------------------------------------------------------------------------- */

export const PAGE_NOTES = {
  meta: {
    titre: { fr: "Notes", en: "Notes" },
    description: {
      fr: "Notes techniques : ce que j'ai appris en portant des modèles, en vérifiant des calculs et en construisant des outils qui doivent rester justes.",
      en: "Technical notes: what I learned porting models, verifying calculations and building tools that have to stay correct.",
    },
  } satisfies Meta,
  titre: { fr: "Notes", en: "Notes" },
  surTitre: { fr: "Note technique", en: "Technical note" },
  chapeau: {
    fr: "Des défauts précis, rencontrés sur des projets réels, et ce qu'il a fallu comprendre pour les corriger. J'écris ici ce que j'aurais voulu lire avant de m'y casser les dents.",
    en: "Specific defects, met on real projects, and what it took to understand them. I write here what I would have liked to read before running into them.",
  },
  suivante: { fr: "Note suivante", en: "Next note" },
  /* Une fonction plutôt qu'une chaîne : l'accord au pluriel n'est pas le même. */
  duree: (minutes: number, langue: "fr" | "en") =>
    langue === "fr" ? `${minutes} minutes de lecture` : `${minutes} min read`,
} as const;

/* -------------------------------------------------------------------------- */
/* Évaluations                                                                 */
/* -------------------------------------------------------------------------- */

export const PAGE_EVALUATIONS = {
  meta: {
    titre: { fr: "Évaluations", en: "Evaluations" },
    description: {
      fr: "Le moteur de recherche du site, noté sur un jeu de questions figé : rappel, rang réciproque moyen, précision, silence, et les échecs montrés.",
      en: "This site's search engine, graded on a fixed question set: recall, mean reciprocal rank, precision, silence, and the failures shown.",
    },
  } satisfies Meta,
  titre: { fr: "Évaluations", en: "Evaluations" },
  chapeau: {
    fr: "Un moteur de recherche sémantique donne toujours une réponse. Elle est plausible, elle cite une source, elle a l'air juste, et personne ne va vérifier. Voici les chiffres, le jeu de questions qui les produit, et les cas où ça rate.",
    en: "A semantic search engine always gives an answer. It is plausible, it cites a source, it looks right, and nobody goes and checks. Here are the numbers, the question set that produces them, and the cases where it fails.",
  },
  pourquoi: {
    titre: { fr: "Pourquoi cette page", en: "Why this page" },
    paragraphes: [
      {
        fr: "C'est le mode d'échec propre à cette famille d'outils : on ne distingue pas à l'œil un système qui trouve d'un système qui devine, parce que les deux produisent le même objet à l'écran. Un extrait, une source, un score. La seule façon de trancher est de fixer d'avance ce qui répond, puis de mesurer.",
        en: "This is the failure mode peculiar to this family of tools: you cannot tell by eye a system that finds from a system that guesses, because both produce the same object on screen. A passage, a source, a score. The only way to settle it is to fix in advance what counts as an answer, then measure.",
      },
      {
        fr: "Le jeu compte dix-huit questions, dont quatre n'attendent aucune réponse. Ces quatre-là ne sont pas du remplissage : un moteur qui répond à tout est un moteur qui ment, et un système qui obtiendrait un rappel parfait en citant toujours quelque chose doit échouer ici. C'est la mesure qu'on omet le plus souvent, parce qu'elle fait baisser la moyenne.",
        en: "The set holds eighteen questions, four of which expect no answer at all. Those four are not filler: an engine that answers everything is an engine that lies, and a system scoring perfect recall by always citing something has to fail here. It is the measure most often left out, because it drags the average down.",
      },
      {
        fr: "La vérité terrain est écrite à la main, en lisant les passages, et pas en regardant ce que le moteur renvoie. L'ordre inverse est le biais le plus courant de l'exercice : on ajuste l'étiquetage jusqu'à ce que le score plaise, et on mesure alors sa propre complaisance. Cela reste le jugement d'une seule personne sur un corpus qu'elle a écrit. Le dire est plus utile que de prétendre le contraire.",
        en: "The ground truth is written by hand, by reading the passages, not by looking at what the engine returns. The reverse order is the commonest bias in this exercise: you adjust the labelling until the score pleases you, and then you are measuring your own indulgence. It remains one person's judgement on a corpus they wrote. Saying so is more useful than pretending otherwise.",
      },
    ],
  },
  mesures: {
    titre: { fr: "Ce que chaque nombre cache", en: "What each number hides" },
    chapeau: {
      fr: "Aucun ne suffit seul, et c'est pour cela qu'ils sont quatre.",
      en: "None of them is enough on its own, which is why there are four.",
    },
    etages: [
      {
        titre: { fr: "Rappel@4", en: "Recall@4" },
        corps: {
          fr: "La part des questions où au moins un bon passage remonte. Il ignore le rang : trouver la bonne réponse en quatrième position compte autant que la trouver en première, alors que personne ne lit la quatrième.",
          en: "The share of questions where at least one good passage comes back. It ignores rank: finding the right answer in fourth place counts as much as first, and nobody reads the fourth.",
        },
      },
      {
        titre: { fr: "Rang réciproque moyen", en: "Mean reciprocal rank" },
        corps: {
          fr: "La moyenne de 1/rang du premier bon passage. Il corrige le précédent, mais ne dit rien de ce qui accompagne la bonne réponse : un moteur qui la place première et remplit le reste de bruit obtient 1,00.",
          en: "The average of 1/rank of the first good passage. It corrects the previous one, but says nothing about what accompanies the right answer: an engine that puts it first and fills the rest with noise scores 1.00.",
        },
      },
      {
        titre: { fr: "Précision@4", en: "Precision@4" },
        corps: {
          fr: "La part de bons passages parmi tout ce qui est rendu. Elle attrape ce bruit, et elle est plafonnée par construction : quand une question n'a que deux bonnes réponses et que le moteur en rend quatre, elle ne peut pas dépasser 0,50 même en étant parfaite. La lire comme une note serait une erreur.",
          en: "The share of good passages among everything returned. It catches that noise, and it is capped by construction: when a question has only two right answers and the engine returns four, it cannot exceed 0.50 even when perfect. Reading it as a grade would be a mistake.",
        },
      },
      {
        titre: { fr: "Silence", en: "Silence" },
        corps: {
          fr: "La part des questions hors corpus où le moteur ne cite rien. C'est le seul des quatre qui punisse un système trop bavard.",
          en: "The share of out-of-corpus questions where the engine cites nothing. It is the only one of the four that punishes an over-talkative system.",
        },
      },
    ],
  },
  seuil: {
    titre: { fr: "Le seuil, et ce qu'il ne règle pas", en: "The threshold, and what it cannot fix" },
    paragraphes: [
      {
        fr: "Le seuil de pertinence décide de ce qui mérite d'être cité. Il arbitre entre deux erreurs opposées : trop bas, le moteur répond à une question hors sujet parce qu'un passage flotte au-dessus ; trop haut, il se tait sur une question à laquelle le corpus répond. La valeur retenue, 0,22, est le plus petit seuil qui atteigne le silence maximal. En dessous, deux questions hors corpus reçoivent une réponse. Au-dessus, rien ne s'améliore jusqu'à ce que le rappel s'effondre.",
        en: "The relevance threshold decides what deserves quoting. It arbitrates between two opposite errors: too low and the engine answers an off-topic question because some passage floats above it; too high and it stays silent on a question the corpus answers. The value kept, 0.22, is the smallest threshold that reaches maximum silence. Below it, two out-of-corpus questions get an answer. Above it, nothing improves until recall collapses.",
      },
      {
        fr: "La courbe dit surtout ce que le seuil ne peut pas régler. La question sur la configuration d'un cluster Kubernetes reçoit une réponse à tous les seuils balayés, y compris au plus sévère : le champ lexical de l'infrastructure est assez proche de celui du corpus pour que des passages sans rapport marquent haut. Ce n'est pas un problème de réglage, c'est une limite de la similarité cosinus sur un corpus étroit, et aucune valeur ne la fera disparaître.",
        en: "What the curve mostly says is what the threshold cannot fix. The question about configuring a Kubernetes cluster gets an answer at every threshold swept, including the harshest: the lexical field of infrastructure is close enough to the corpus for unrelated passages to score high. That is not a tuning problem, it is a limit of cosine similarity on a narrow corpus, and no value will make it go away.",
      },
    ],
  },
  refaire: {
    titre: { fr: "Refaites le calcul", en: "Run it yourself" },
    corps: {
      fr: "Les chiffres ci-dessus sont produits au build et versionnés avec le site : la page s'affiche sans une ligne de JavaScript. Le bouton rejoue l'évaluation entière dans votre navigateur, avec le même modèle et les mêmes vecteurs, et affiche ce qu'il trouve. C'est la seule forme de publication de résultats qui vaille quelque chose : un chiffre qu'on peut refaire tomber soi-même.",
      en: "The figures above are produced at build time and versioned with the site: the page renders without a line of JavaScript. The button replays the whole evaluation inside your browser, with the same model and the same vectors, and shows what it finds. It is the only form of published result worth anything: a number you can make fall out again yourself.",
    },
  },
} as const;
