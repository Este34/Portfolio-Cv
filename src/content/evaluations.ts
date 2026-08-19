import type { Bilingue } from "../lib/langue.ts";

/**
 * Le jeu d'évaluation du moteur de recherche.
 *
 * ## Pourquoi ce fichier existe
 *
 * Un moteur de recherche sémantique donne toujours une réponse. Elle est
 * plausible, elle cite une source, elle a l'air juste — et personne ne va
 * vérifier. C'est le mode d'échec propre à cette famille d'outils : on ne
 * distingue pas à l'œil un système qui trouve d'un système qui devine, parce
 * que les deux produisent le même objet à l'écran.
 *
 * La seule façon de trancher est de fixer d'avance ce qui répond, puis de
 * mesurer. Ce fichier fixe. `lib/evaluation.ts` mesure.
 *
 * ## La vérité terrain est écrite à la main, et c'est sa limite
 *
 * Chaque question porte la liste des passages qui y répondent **réellement**,
 * établie en lisant les passages, pas en regardant ce que le moteur renvoie.
 * L'ordre inverse est le biais le plus courant de cet exercice : on ajuste
 * l'étiquetage jusqu'à ce que le score plaise, et on mesure alors sa propre
 * complaisance.
 *
 * Cela reste un jugement, celui d'une seule personne, sur un corpus qu'elle a
 * écrit. Le dire est plus utile que de prétendre le contraire : le jeu est
 * versionné, lisible, et n'importe qui peut contester une étiquette.
 *
 * ## Les questions sans réponse comptent autant que les autres
 *
 * Quatre entrées n'attendent **aucun** passage. Elles ne sont pas du
 * remplissage : un moteur qui répond à tout est un moteur qui ment, et le
 * seuil de pertinence qui l'en empêche ne se règle qu'en mesurant ce qu'il
 * laisse passer. Un système qui obtiendrait un rappel parfait en citant
 * toujours quelque chose échouerait ici, comme il le doit.
 */

export type CasEvaluation = {
  id: string;
  question: Bilingue;
  /**
   * Identifiants des passages qui répondent. Vide si la question sort du
   * corpus, auquel cas la bonne réponse est de ne rien citer.
   */
  attendus: readonly string[];
  /** Ce que le cas met à l'épreuve. Affiché sur la page. */
  intention: Bilingue;
};

export const EVALUATIONS: readonly CasEvaluation[] = [
  {
    id: "competences-donnees",
    question: {
      fr: "Qu'est-ce qu'il sait faire en données ?",
      en: "What can he actually do with data?",
    },
    attendus: ["competences-Données", "identite"],
    intention: {
      fr: "Une question large, dont la réponse est une liste explicite.",
      en: "A broad question whose answer is an explicit list.",
    },
  },
  {
    id: "deja-ia",
    question: {
      fr: "A-t-il déjà travaillé sur de l'intelligence artificielle ?",
      en: "Has he already worked on artificial intelligence?",
    },
    attendus: ["mon-rag-resume", "competences-Intelligence artificielle", "mon-rag-domaines"],
    intention: {
      fr: "Le mot « IA » n'apparaît pas tel quel dans le meilleur passage : c'est une question de sens, pas de mot-clé.",
      en: "The phrase «AI» does not appear verbatim in the best passage: this tests meaning, not keywords.",
    },
  },
  {
    id: "verification",
    question: {
      fr: "Comment vérifie-t-il que son code est juste ?",
      en: "How does he check that his code is correct?",
    },
    attendus: ["methode-verification", "methode-garde", "suite-simulateurs-prospective-decision-1"],
    intention: {
      fr: "Trois passages de deux sources différentes répondent. Le plafond par source doit laisser passer les deux.",
      en: "Three passages from two different sources answer. The per-source cap must let both through.",
    },
  },
  {
    id: "formation",
    question: { fr: "Quelle est sa formation ?", en: "What did he study?" },
    attendus: ["parcours-Master 1 · AI Engineer", "parcours-Licence MIASHS, parcours"],
    intention: {
      fr: "Deux passages voisins d'une même source : le plafond par source ne doit pas en couper un.",
      en: "Two neighbouring passages from one source: the per-source cap must not cut one of them.",
    },
  },
  {
    id: "agents-de-code",
    question: {
      fr: "Travaille-t-il avec des agents de code ?",
      en: "Does he work with coding agents?",
    },
    attendus: ["methode-Ce que je délègue", "methode-garde", "competences-Intelligence artificielle"],
    intention: {
      fr: "Un sujet traité longuement, donc facile — s'il échouait, le corpus serait mal découpé.",
      en: "A subject covered at length, therefore easy: failing here would mean the corpus is badly chunked.",
    },
  },
  {
    id: "reprise-interruption",
    question: {
      fr: "Que fait son pipeline quand l'extraction est interrompue ?",
      en: "What does his pipeline do when the extraction is interrupted?",
    },
    attendus: ["pipeline-comtrade-decision-0", "pipeline-comtrade-contraintes"],
    intention: {
      fr: "Une question précise dont la réponse est un détail d'ingénierie, pas un titre de projet.",
      en: "A precise question whose answer is an engineering detail, not a project title.",
    },
  },
  {
    id: "hors-ligne",
    question: {
      fr: "Quel projet fonctionne sans serveur, entièrement dans le navigateur ?",
      en: "Which project runs without a server, entirely in the browser?",
    },
    attendus: [
      "pipeline-comtrade-decision-1",
      "pipeline-comtrade-chiffres",
      "pipeline-comtrade-contraintes",
    ],
    intention: {
      fr: "Plusieurs projets pourraient prétendre répondre. Un seul le fait vraiment.",
      en: "Several projects could seem to answer. Only one really does.",
    },
  },
  {
    id: "champ-vide",
    question: {
      fr: "Pourquoi un champ laissé vide ne vaut-il pas zéro ?",
      en: "Why does a field left empty not mean zero?",
    },
    attendus: ["note-un-champ-vide-ne-vaut-pas-zero", "suite-simulateurs-prospective-decision-3"],
    intention: {
      fr: "La note et la décision technique disent la même chose à deux échelles. Les deux sont justes.",
      en: "The note and the technical decision say the same thing at two scales. Both are right.",
    },
  },
  {
    id: "portage-tableur",
    question: {
      fr: "A-t-il déjà porté un modèle de calcul depuis un tableur ?",
      en: "Has he ported a calculation model out of a spreadsheet?",
    },
    attendus: [
      "suite-simulateurs-prospective-resume",
      "suite-simulateurs-prospective-decision-0",
      "suite-simulateurs-prospective-contexte",
      "note-un-champ-vide-ne-vaut-pas-zero",
    ],
    intention: {
      fr: "Le cœur du positionnement. Si cette question rate, le site rate.",
      en: "The core of the positioning. If this question misses, the site misses.",
    },
  },
  {
    id: "front-end",
    question: {
      fr: "Quelles technologies web utilise-t-il ?",
      en: "Which web technologies does he use?",
    },
    attendus: ["competences-Web", "plateforme-simulateurs-resume"],
    intention: {
      fr: "Une liste, encore, mais concurrencée par les listes de technologies de chaque projet.",
      en: "A list again, but competing with each project's own technology list.",
    },
  },
  {
    id: "sans-bibliotheque",
    question: {
      fr: "Pourquoi a-t-il écrit du JavaScript sans outil de build ?",
      en: "Why did he write JavaScript with no build tool?",
    },
    attendus: ["suite-simulateurs-prospective-decision-2", "suite-simulateurs-prospective-contraintes"],
    intention: {
      fr: "La réponse est une contrainte de livraison, pas une préférence technique. Le passage doit être trouvé pour que la nuance survive.",
      en: "The answer is a delivery constraint, not a technical preference. The passage must be found for the nuance to survive.",
    },
  },
  {
    id: "base-vectorielle",
    question: {
      fr: "Pourquoi ne pas utiliser une base vectorielle ?",
      en: "Why not use a vector database?",
    },
    attendus: ["mon-rag-decision-0", "mon-rag-contexte"],
    intention: {
      fr: "Une question formulée en négatif, qui vise un arbitrage précis.",
      en: "A question phrased in the negative, aimed at one specific trade-off.",
    },
  },
  {
    id: "ou-travaille",
    question: { fr: "Où travaille-t-il en ce moment ?", en: "Where is he working right now?" },
    attendus: ["parcours-Data & AI engineering, e"],
    intention: {
      fr: "Un seul passage répond. C'est le cas le plus dur pour un rappel à quatre.",
      en: "Only one passage answers. That is the hardest case for recall at four.",
    },
  },
  {
    id: "tests-outils",
    question: {
      fr: "Avec quels outils écrit-il ses tests ?",
      en: "Which tools does he write his tests with?",
    },
    attendus: ["competences-Pratiques"],
    intention: {
      fr: "La réponse tient en trois mots dans un seul passage, noyés dans une énumération.",
      en: "The answer is three words inside a single passage, buried in an enumeration.",
    },
  },

  /* ---- Hors corpus : la bonne réponse est de ne rien citer ---------------- */

  {
    id: "hors-plat",
    question: { fr: "Quel est son plat préféré ?", en: "What is his favourite dish?" },
    attendus: [],
    intention: {
      fr: "Rien dans le corpus. Répondre quand même serait le pire des comportements.",
      en: "Nothing in the corpus. Answering anyway would be the worst behaviour.",
    },
  },
  {
    id: "hors-meteo",
    question: {
      fr: "Quel temps fera-t-il demain à Montpellier ?",
      en: "What will the weather be tomorrow in Montpellier?",
    },
    attendus: [],
    intention: {
      fr: "Une ville qui apparaît ailleurs sur le web mais pas ici, et une question sans rapport.",
      en: "A city that appears elsewhere on the web but not here, and an unrelated question.",
    },
  },
  {
    id: "hors-salaire",
    question: {
      fr: "Combien gagne-t-il par mois ?",
      en: "How much does he earn per month?",
    },
    attendus: [],
    intention: {
      fr: "Une question légitime dont la réponse n'est volontairement nulle part.",
      en: "A legitimate question whose answer is deliberately nowhere.",
    },
  },
  {
    id: "hors-kubernetes",
    question: {
      fr: "Comment configure-t-il un cluster Kubernetes ?",
      en: "How does he configure a Kubernetes cluster?",
    },
    attendus: [],
    intention: {
      fr: "Le piège le plus intéressant : du vocabulaire technique voisin, sur une compétence qu'il n'a pas. Le moteur doit résister à la proximité de champ lexical.",
      en: "The most interesting trap: neighbouring technical vocabulary, for a skill he does not have. The engine must resist lexical-field proximity.",
    },
  },
] as const;

/** Les cas dont on attend au moins un passage. */
export const CAS_AVEC_REPONSE = EVALUATIONS.filter((c) => c.attendus.length > 0);
/** Les cas dont la bonne réponse est le silence. */
export const CAS_SANS_REPONSE = EVALUATIONS.filter((c) => c.attendus.length === 0);
