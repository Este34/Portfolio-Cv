// Import relatif volontaire : voir la note dans `travaux.ts`.
import type { Bilingue } from "../lib/langue.ts";
import { EMPLOYEUR } from "../lib/site.ts";

/**
 * Parcours.
 *
 * Renseigné depuis le CV d'Esteban (août 2026). Deux écarts assumés avec ce
 * CV, et il faut les connaître :
 *
 *  1. **Les emplois alimentaires n'y figurent pas** (restauration, garde
 *     d'enfants). Ils ont leur place sur un CV, pas sur un portfolio technique
 *     où ils diluent la lecture. À réintégrer si Esteban le souhaite.
 *  2. **Ni adresse ni téléphone.** Voir la note sur `CONTACT` dans
 *     `lib/site.ts`.
 */

export type Etape = {
  periode: Bilingue;
  titre: Bilingue;
  lieu: Bilingue;
  description: Bilingue;
};

export const FORMATION: readonly Etape[] = [
  {
    periode: { fr: "2026 →", en: "2026 →" },
    titre: { fr: "Master 1 · AI Engineer", en: "MSc year 1 · AI Engineer" },
    lieu: {
      fr: "Université Paris 8, Saint-Denis",
      en: "Université Paris 8, Saint-Denis, France",
    },
    description: {
      fr: "Formation à l'ingénierie des systèmes d'intelligence artificielle : apprentissage automatique, traitement du langage, mise en production de modèles.",
      en: "Training in AI systems engineering: machine learning, natural language processing, and putting models into production.",
    },
  },
  {
    periode: { fr: "2022 à 2026", en: "2022 to 2026" },
    titre: {
      fr: "Licence MIASHS, parcours sciences cognitives",
      en: "BSc in mathematics and computer science for the social sciences, cognitive science track",
    },
    lieu: {
      fr: "Université Paul-Valéry Montpellier 3",
      en: "Université Paul-Valéry Montpellier 3, France",
    },
    description: {
      fr: "Mathématiques et informatique appliquées aux sciences humaines et sociales. Statistiques, programmation, modélisation. Et le versant cognitif : perception, décision, comportement.",
      en: "Mathematics and computer science applied to the human and social sciences. Statistics, programming, modelling. And the cognitive side of it: perception, decision, behaviour.",
    },
  },
];

export const EXPERIENCES: readonly Etape[] = [
  {
    periode: { fr: "Juin 2026 →", en: "June 2026 →" },
    titre: {
      fr: "Data & AI engineering, en alternance",
      en: "Data & AI engineering apprenticeship",
    },
    lieu: EMPLOYEUR.libelleCapitalise,
    description: {
      fr: "Portage de quatre modèles de prospective d'Excel et Power BI vers des applications web autonomes, vérifiées numériquement contre le modèle d'origine. Conception de la plateforme qui les héberge.",
      en: "Ported four foresight models from Excel and Power BI into self-contained web applications, numerically verified against the source model. Designed the platform that hosts them.",
    },
  },
  {
    periode: { fr: "Mars 2023", en: "March 2023" },
    titre: {
      fr: "Panel citoyen européen, rapporteur de groupe",
      en: "European Citizens' Panel, working-group rapporteur",
    },
    lieu: { fr: "Parlement européen", en: "European Parliament" },
    description: {
      fr: "Sélectionné parmi cent citoyens européens pour formuler des recommandations sur la mobilité d'apprentissage. Rapporteur d'un groupe de travail : synthétiser des positions divergentes, puis les défendre en plénière.",
      en: "Selected among one hundred European citizens to draft recommendations on learning mobility. Rapporteur for a working group: synthesising positions that did not agree, then defending them in plenary.",
    },
  },
];

/**
 * Compétences regroupées par nature plutôt que par « niveau ».
 * Une barre de progression sur une compétence ne veut rien dire et personne
 * n'y croit.
 *
 * Les intitulés sont traduits ; les noms de technologies ne le sont pas, sauf
 * lorsqu'ils décrivent une pratique plutôt qu'un outil.
 */
/**
 * Compétences, avec ce qu'elles veulent dire.
 *
 * Chaque famille portait une simple liste de mots. C'était insuffisant pour
 * deux raisons mesurées, et pas une seule.
 *
 * La première est éditoriale : « Python, DuckDB, SQL » ne dit pas ce qu'on en
 * fait, et un CV rempli de mots-clés se lit comme une liste de courses.
 *
 * La seconde est mécanique. Le banc d'évaluation a montré que le passage
 * « Compétences en pratiques : Vérification numérique de portage, Tests
 * (Vitest, Playwright), Intégration continue, Accessibilité, Documentation »
 * ne remonte **pas** sur la question « avec quels outils écrit-il ses
 * tests ? », alors que la réponse y est écrite noir sur blanc. Cinq sujets
 * sans rapport dans une énumération : la moyenne de leurs vecteurs ne pointe
 * vers aucun d'entre eux. Voir la note « Le cosinus n'est pas une note ».
 *
 * Le `corps` ancre chaque famille dans un projet réel. Il sert au CV, à la
 * page parcours, et au corpus du moteur de recherche.
 */
export const COMPETENCES: readonly {
  famille: Bilingue;
  corps: Bilingue;
  items: readonly Bilingue[];
}[] = [
  {
    famille: { fr: "Données", en: "Data" },
    corps: {
      fr: "Extraire d'une API payante et limitée sans jamais retélécharger deux fois la même chose, stocker en Parquet partitionné, interroger en SQL depuis le navigateur. Le pipeline de commerce international couvre 240 pays sur vingt-cinq ans, et se reprend tout seul après une interruption.",
      en: "Pulling from a metered, paid API without ever downloading the same thing twice, storing it as partitioned Parquet, querying it in SQL from the browser. The international-trade pipeline covers 240 countries over twenty-five years, and resumes on its own after an interruption.",
    },
    items: [
      { fr: "Python", en: "Python" },
      { fr: "DuckDB", en: "DuckDB" },
      { fr: "Apache Parquet", en: "Apache Parquet" },
      { fr: "openpyxl", en: "openpyxl" },
      { fr: "NumPy", en: "NumPy" },
      { fr: "SQL", en: "SQL" },
      { fr: "R", en: "R" },
      { fr: "Pipelines d'extraction", en: "Extraction pipelines" },
    ],
  },
  {
    famille: { fr: "Web", en: "Web" },
    corps: {
      fr: "Des applications qui tiennent dans un onglet. Next.js et React quand il y a un site à construire, JavaScript sans outil de build quand le livrable doit s'ouvrir hors ligne depuis une pièce jointe. Les fonds animés de ce site sont des shaders écrits à la main plutôt qu'une bibliothèque 3D.",
      en: "Applications that fit inside a tab. Next.js and React when there is a site to build, build-tool-free JavaScript when the deliverable has to open offline from an email attachment. This site's animated backgrounds are hand-written shaders rather than a 3D library.",
    },
    items: [
      { fr: "TypeScript", en: "TypeScript" },
      { fr: "React 19", en: "React 19" },
      { fr: "Next.js", en: "Next.js" },
      { fr: "Tailwind CSS", en: "Tailwind CSS" },
      { fr: "JavaScript sans build", en: "Build-free JavaScript" },
      { fr: "GLSL / WebGL", en: "GLSL / WebGL" },
    ],
  },
  {
    famille: { fr: "Intelligence artificielle", en: "Artificial intelligence" },
    corps: {
      fr: "Une recherche augmentée écrite sans framework, puis portée dans le navigateur : le moteur de ce site vectorise votre question sur votre machine. Un agent qui enchaîne ses outils au lieu d'attendre qu'on les actionne. Et un banc qui les note sur des questions figées, parce qu'un système qui répond toujours ne se juge pas à l'œil.",
      en: "Retrieval-augmented search written without a framework, then ported into the browser: this site's engine embeds your question on your own machine. An agent that chains its tools instead of waiting to be told. And a bench that grades them on a fixed question set, because a system that always answers cannot be judged by eye.",
    },
    items: [
      { fr: "Recherche augmentée (RAG)", en: "Retrieval-augmented generation" },
      { fr: "sentence-transformers", en: "sentence-transformers" },
      { fr: "Ollama", en: "Ollama" },
      { fr: "Agents de code", en: "Coding agents" },
    ],
  },
  {
    famille: { fr: "Simulation & visualisation", en: "Simulation & visualisation" },
    corps: {
      fr: "Porter un modèle de prospective d'un classeur vers le navigateur, et surtout vérifier le portage : le générateur rejoue les trajectoires de référence avec le modèle porté et refuse de produire les données au-delà de 0,1 % d'écart. Écart constaté en pratique : 0,00002 %.",
      en: "Porting a foresight model out of a spreadsheet and into the browser, and above all checking the port: the generator replays the reference trajectories with the ported model and refuses to emit the data beyond 0.1% drift. Drift observed in practice: 0.00002%.",
    },
    items: [
      { fr: "Portage de modèles", en: "Model porting" },
      { fr: "Chart.js", en: "Chart.js" },
      { fr: "Three.js", en: "Three.js" },
      { fr: "Leaflet", en: "Leaflet" },
      { fr: "Conception de tableaux de bord", en: "Dashboard design" },
    ],
  },
  {
    famille: { fr: "Pratiques", en: "Practices" },
    corps: {
      fr: "Tests unitaires avec Vitest, régression visuelle avec Playwright, intégration continue qui refuse un build dont les artefacts générés ont dérivé du contenu. Ce portfolio est vérifié par les trois à chaque poussée, plus un budget de poids par page qui échoue si une page grossit.",
      en: "Unit tests with Vitest, visual regression with Playwright, continuous integration that refuses a build whose generated artefacts have drifted from the content. This portfolio is checked by all three on every push, plus a per-page weight budget that fails if a page grows.",
    },
    items: [
      { fr: "Vérification numérique de portage", en: "Numerical verification of ports" },
      { fr: "Tests (Vitest, Playwright)", en: "Testing (Vitest, Playwright)" },
      { fr: "Intégration continue", en: "Continuous integration" },
      { fr: "Accessibilité", en: "Accessibility" },
      { fr: "Documentation", en: "Documentation" },
    ],
  },
];
