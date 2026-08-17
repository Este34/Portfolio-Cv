// Import relatif volontaire : voir la note dans `travaux.ts`.
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
  periode: string;
  titre: string;
  lieu: string;
  description: string;
  aCompleter?: boolean;
};

export const FORMATION: readonly Etape[] = [
  {
    periode: "2026 →",
    titre: "Master 1 · AI Engineer",
    lieu: "Université Paris 8, Saint-Denis",
    description:
      "Formation à l'ingénierie des systèmes d'intelligence artificielle : apprentissage automatique, traitement du langage, mise en production de modèles.",
  },
  {
    periode: "2022 à 2026",
    titre: "Licence MIASHS, parcours sciences cognitives",
    lieu: "Université Paul-Valéry Montpellier 3",
    description:
      "Mathématiques et informatique appliquées aux sciences humaines et sociales. Statistiques, programmation, modélisation. Et le versant cognitif : perception, décision, comportement.",
  },
];

export const EXPERIENCES: readonly Etape[] = [
  {
    periode: "Juin 2026 →",
    titre: "Data & AI engineering, en alternance",
    lieu: EMPLOYEUR.libelleCapitalise,
    description:
      "Portage de quatre modèles de prospective d'Excel et Power BI vers des applications web autonomes, vérifiées numériquement contre le modèle d'origine. Conception de la plateforme qui les héberge.",
  },
  {
    periode: "Mars 2023",
    titre: "Panel citoyen européen, rapporteur de groupe",
    lieu: "Parlement européen",
    description:
      "Sélectionné parmi cent citoyens européens pour formuler des recommandations sur la mobilité d'apprentissage. Rapporteur d'un groupe de travail : synthétiser des positions divergentes, puis les défendre en plénière.",
  },
];

/**
 * Compétences regroupées par nature plutôt que par « niveau ».
 * Une barre de progression sur une compétence ne veut rien dire et personne
 * n'y croit.
 */
export const COMPETENCES = [
  {
    famille: "Données",
    items: ["Python", "DuckDB", "Apache Parquet", "openpyxl", "NumPy", "SQL", "R", "Pipelines d'extraction"],
  },
  {
    famille: "Web",
    items: ["TypeScript", "React 19", "Next.js", "Tailwind CSS", "JavaScript sans build", "GLSL / WebGL"],
  },
  {
    famille: "Intelligence artificielle",
    items: ["Recherche augmentée (RAG)", "sentence-transformers", "Ollama", "Agents de code"],
  },
  {
    famille: "Simulation & visualisation",
    items: ["Portage de modèles", "Chart.js", "Three.js", "Leaflet", "Conception de tableaux de bord"],
  },
  {
    famille: "Pratiques",
    items: [
      "Vérification numérique de portage",
      "Tests (Vitest, Playwright)",
      "Intégration continue",
      "Accessibilité",
      "Documentation",
    ],
  },
] as const;
