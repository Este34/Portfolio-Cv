import type { Bilingue } from "../lib/langue.ts";

/**
 * Chaînes de l'habillage : en-tête, pied, boutons, étiquettes récurrentes.
 *
 * Séparées de `pages.ts`, qui porte la prose. La distinction est utile parce
 * que les deux ne se relisent pas de la même façon : ici on vérifie la
 * cohérence d'un vocabulaire employé partout, là on relit un texte suivi.
 */
export const UI = {
  allerAuContenu: { fr: "Aller au contenu", en: "Skip to content" },
  accueil: { fr: "accueil", en: "home" },
  navigationPrincipale: { fr: "Navigation principale", en: "Main navigation" },
  piedDePage: { fr: "Pied de page", en: "Footer" },
  sections: { fr: "Sections", en: "Sections" },
  ailleurs: { fr: "Ailleurs", en: "Elsewhere" },
  courriel: { fr: "Courriel", en: "Email" },
  ecrireUnCourriel: { fr: "Écrire un courriel", en: "Send an email" },
  sansTraceur: { fr: "Aucun traceur · Aucun cookie", en: "No trackers · No cookies" },

  /* Bascules de l'en-tête. */
  changerDeLangue: { fr: "Read this site in English", en: "Lire ce site en français" },
  changerDeLangueCourt: { fr: "EN", en: "FR" },
  themeClair: { fr: "Passer au thème clair", en: "Switch to light theme" },
  themeSombre: { fr: "Passer au thème sombre", en: "Switch to dark theme" },

  /* Accueil. */
  voirLesTravaux: { fr: "Voir les travaux", en: "See the work" },
  leLabo: { fr: "Le labo", en: "The lab" },
  toutVoir: { fr: "Tout voir →", en: "See all →" },
  chiffresCles: { fr: "Chiffres clés", en: "Key figures" },
  leParcoursEnDetail: { fr: "Le parcours en détail", en: "The full background" },
  commentJeTravaille: { fr: "Comment je travaille", en: "How I work" },

  /* Étude de cas. */
  role: { fr: "Rôle", en: "Role" },
  domaines: { fr: "Domaines", en: "Domains" },
  diffusion: { fr: "Diffusion", en: "Disclosure" },
  stack: { fr: "Stack", en: "Stack" },
  depotPublic: { fr: "Dépôt public", en: "Public repository" },
  sousAnonymat: {
    fr: "Présenté sous anonymat, à la demande du commanditaire",
    en: "Presented anonymously, at the client's request",
  },
  voirLaDemonstration: { fr: "Voir la démonstration ↗", en: "See the demo ↗" },
  leDepot: { fr: "Le dépôt ↗", en: "The repository ↗" },
  captures: { fr: "Captures", en: "Screenshots" },
  chiffres: { fr: "Chiffres", en: "Figures" },
  contexte: { fr: "Contexte", en: "Context" },
  contraintes: { fr: "Contraintes", en: "Constraints" },
  decisions: { fr: "Décisions", en: "Decisions" },
  decision: { fr: "Décision", en: "Decision" },
  resultats: { fr: "Résultats", en: "Results" },
  travailSuivant: { fr: "Travail suivant", en: "Next project" },
  technologiesEmployees: { fr: "Technologies employées", en: "Technologies used" },
  lireLetude: { fr: "Lire l'étude", en: "Read the case study" },

  /* Parcours. */
  experience: { fr: "Expérience", en: "Experience" },
  formation: { fr: "Formation", en: "Education" },
  competences: { fr: "Compétences", en: "Skills" },

  /* Labo et corpus. */
  demonstration: { fr: "Démonstration", en: "Demo" },
  actif: { fr: "actif", en: "running" },
  enPause: { fr: "en pause", en: "paused" },

  /* Making-of. */
  arbitrage: { fr: "Arbitrage", en: "Trade-off" },
  mesures: { fr: "Mesures", en: "Measurements" },
} as const satisfies Record<string, Bilingue>;

/**
 * Chaînes des simulations.
 *
 * Elles vivent à part parce qu'elles sont d'une autre nature : des étiquettes
 * de cadran, lues en un coup d'œil pendant que quelque chose bouge. Elles se
 * relisent ensemble, avec en tête la place disponible sous le canvas.
 */
export const LABO = {
  /* Descriptions pour lecteur d'écran : le canvas est annoncé comme une image. */
  labelReseau: {
    fr: "Réseau de neurones apprenant à séparer deux classes, avec sa courbe de perte",
    en: "Neural network learning to separate two classes, with its loss curve",
  },
  labelNuee: {
    fr: "Simulation de nuée : chaque individu suit trois règles locales",
    en: "Flocking simulation: each individual follows three local rules",
  },
  labelKMoyennes: {
    fr: "k-moyennes : convergence itérative de quatre centres",
    en: "k-means: iterative convergence of four centroids",
  },
  labelAgar: {
    fr: "Agar jouable : la cellule suit le curseur",
    en: "Playable agar: the cell follows the cursor",
  },

  /* Réseau. */
  poserDesPoints: {
    fr: "Cliquez pour poser des points des deux couleurs",
    en: "Click to place points of both colours",
  },
  autreForme: { fr: "Autre forme", en: "Another shape" },
  forme: { fr: "Forme", en: "Shape" },
  plafondLineaire: { fr: "Plafond linéaire", en: "Linear ceiling" },
  /*
   * Les noms des six jeux de données.
   *
   * Traduits, parce qu'ils sont lus comme une étiquette et non comme un terme
   * technique : « lunes » et « moons » désignent la même figure dans la
   * littérature, mais un lecteur français ne reconnaît pas « two moons ».
   */
  formes: {
    lunes: { fr: "Deux lunes", en: "Two moons" },
    bandes: { fr: "Bandes", en: "Stripes" },
    spirales: { fr: "Spirales", en: "Spirals" },
    anneaux: { fr: "Anneaux", en: "Rings" },
    amas: { fr: "Amas en OU exclusif", en: "Exclusive-or clusters" },
    damier: { fr: "Damier", en: "Checkerboard" },
  },
  dessiner: { fr: "Dessiner", en: "Draw" },
  couleurPosee: { fr: "Couleur posée au clic", en: "Colour placed on click" },
  bleu: { fr: "Bleu", en: "Blue" },
  corail: { fr: "Corail", en: "Coral" },
  points: { fr: "Points", en: "Points" },
  lotsVus: { fr: "Lots vus", en: "Batches seen" },
  perte: { fr: "Perte", en: "Loss" },
  justesse: { fr: "Justesse", en: "Accuracy" },

  /* k-moyennes. */
  iteration: { fr: "Itération", en: "Iteration" },
  inertie: { fr: "Inertie", en: "Inertia" },
  etat: { fr: "État", en: "State" },
  converge: { fr: "convergé", en: "converged" },
  enCours: { fr: "en cours", en: "running" },

  /* Agar. */
  masse: { fr: "Masse", en: "Mass" },
  absorbe: { fr: "absorbé", en: "absorbed" },
  enVie: { fr: "en vie", en: "alive" },
  absorbeRejouer: {
    fr: "absorbé, cliquer pour rejouer",
    en: "absorbed, click to play again",
  },
  jouer: {
    fr: "Déplacez le curseur sur la zone pour jouer.",
    en: "Move the cursor over the area to play.",
  },

  /* Politique apprise. */
  labelPolitique: {
    fr: "Agent apprenant à survivre par renforcement, avec sa rose des vents de décision et sa courbe d'évaluation",
    en: "Agent learning to survive by reinforcement, with its decision compass and evaluation curve",
  },
  politiqueHasard: { fr: "Hasard", en: "Random" },
  politiqueHeuristique: { fr: "Règle écrite", en: "Hand-written rule" },
  politiqueApprise: { fr: "Apprise", en: "Learned" },
  politiqueEpisodes: { fr: "Épisodes joués", en: "Episodes played" },
  politiqueMeilleure: { fr: "Meilleure", en: "Best" },
  politiqueRelance: { fr: "Repartir de zéro", en: "Start over" },
  politiqueEntrainement: { fr: "en entraînement", en: "training" },
  politiqueEnEvaluation: { fr: "en évaluation", en: "evaluating" },
  politiqueProtocole: {
    fr: "Les deux étalons sont mesurés hors ligne sur {etalons} mondes et vérifiés par un test. La politique apprise est évaluée en direct sur les {eval} premiers de ces mêmes mondes, ce qui est plus bruité : elle bouge d'une seconde ou deux d'un relevé à l'autre sans que rien n'ait changé.",
    en: "Both baselines are measured offline over {etalons} worlds and checked by a test. The learned policy is evaluated live on the first {eval} of those same worlds, which is noisier: it moves by a second or two between readings without anything having changed.",
  },
} as const;
