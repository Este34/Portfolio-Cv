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
export const COMPETENCES: readonly { famille: Bilingue; items: readonly Bilingue[] }[] = [
  {
    famille: { fr: "Données", en: "Data" },
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
    items: [
      { fr: "Recherche augmentée (RAG)", en: "Retrieval-augmented generation" },
      { fr: "sentence-transformers", en: "sentence-transformers" },
      { fr: "Ollama", en: "Ollama" },
      { fr: "Agents de code", en: "Coding agents" },
    ],
  },
  {
    famille: { fr: "Simulation & visualisation", en: "Simulation & visualisation" },
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
    items: [
      { fr: "Vérification numérique de portage", en: "Numerical verification of ports" },
      { fr: "Tests (Vitest, Playwright)", en: "Testing (Vitest, Playwright)" },
      { fr: "Intégration continue", en: "Continuous integration" },
      { fr: "Accessibilité", en: "Accessibility" },
      { fr: "Documentation", en: "Documentation" },
    ],
  },
];
