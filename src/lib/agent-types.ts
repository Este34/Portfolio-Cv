/**
 * Types de l'agent, **sans dépendance à DuckDB ni à transformers.js**.
 *
 * Même raison d'être que `duckdb-types.ts` et `rag-types.ts` : la palette doit
 * pouvoir afficher l'agent, sa trace et ses exemples sans tirer un moteur de
 * plusieurs dizaines de méga-octets dans le lot initial. Les outils ne sont
 * chargés qu'au premier appel, et seulement ceux que l'agent décide d'appeler.
 */

import type { Langue } from "./langue";
import type { ResultatRequete } from "./duckdb-types";
import type { Extrait } from "./rag-types";

/**
 * Les quatre outils, et pourquoi il n'y en a pas cinq.
 *
 * Ce sont exactement les trois modes que la console offrait déjà à la main,
 * plus la terminaison. L'agent n'a reçu aucune capacité nouvelle : il a reçu
 * une boucle. C'est tout l'écart entre une console et un agent, et c'est
 * l'écart que cette démonstration existe pour montrer.
 */
export const OUTILS = ["chercher", "sql", "naviguer", "repondre"] as const;
export type NomOutil = (typeof OUTILS)[number];

export type Action = {
  outil: NomOutil;
  /** Question, requête SQL, chemin de page, ou texte de réponse. */
  argument: string;
  /** Ce que le décideur dit de son choix. Affiché tel quel. */
  raison?: string;
};

export type Observation =
  | { type: "extraits"; extraits: Extrait[] }
  | { type: "table"; resultat: ResultatRequete }
  | { type: "page"; href: string; label: string }
  | { type: "texte"; texte: string }
  | { type: "erreur"; message: string };

export type Etape = {
  /** Numéro de tour, à partir de 1. */
  tour: number;
  action: Action;
  observation: Observation;
  /** Millisecondes passées dans l'outil. */
  duree: number;
};

/** Le régime de décision réellement utilisé, affiché au visiteur. */
export type Regime = "deterministe" | "modele";

export type Resultat = {
  etapes: Etape[];
  /** Texte final, ou `null` si l'agent a épuisé ses tours. */
  reponse: string | null;
  regime: Regime;
  /** Vrai si le régime « modèle » a été tenté puis a échoué. */
  repli: boolean;
  duree: number;
};

/**
 * Plafond de tours.
 *
 * Une boucle d'agent sans plafond est une facture sans plafond, et sur un site
 * public c'est aussi une invitation. Cinq tours suffisent largement aux
 * enchaînements que ce corpus permet — chercher, requêter, naviguer, répondre
 * en laisse encore un de marge. Le plafond est appliqué côté client **et** côté
 * serveur : le client peut mentir.
 */
export const MAX_TOURS = 5;

/** Longueur maximale d'une question acceptée. */
export const MAX_QUESTION = 300;

export type EtatAgent = "inactif" | "reflexion" | "outil" | "fini" | "echec";

export const LIBELLE_OUTIL: Record<Langue, Record<NomOutil, string>> = {
  fr: {
    chercher: "chercher dans le corpus",
    sql: "interroger la base",
    naviguer: "ouvrir une page",
    repondre: "répondre",
  },
  en: {
    chercher: "search the corpus",
    sql: "query the database",
    naviguer: "open a page",
    repondre: "answer",
  },
};

export const LIBELLE_REGIME: Record<Langue, Record<Regime, string>> = {
  fr: {
    deterministe: "planificateur déterministe",
    modele: "modèle",
  },
  en: {
    deterministe: "deterministic planner",
    modele: "model",
  },
};

/**
 * Tâches proposées, choisies pour montrer des plans différents.
 *
 * La première se résout par une requête, la deuxième par une recherche, la
 * troisième par une navigation, la quatrième par un enchaînement des trois. Un
 * jeu d'exemples qui donnerait quatre fois le même plan cacherait précisément
 * ce qu'on cherche à montrer.
 */
export const TACHES_TYPES: Record<Langue, string[]> = {
  fr: [
    "Combien de projets utilisent Python ?",
    "Comment vérifie-t-il que son code est juste ?",
    "Ouvre la page du pipeline Comtrade",
    "Quel projet a le plus de technologies, et ouvre-le",
  ],
  en: [
    "How many projects use Python?",
    "How does he check that his code is correct?",
    "Open the Comtrade pipeline page",
    "Which project uses the most technologies, and open it",
  ],
};
