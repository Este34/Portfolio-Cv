/**
 * Types et constantes du moteur de recherche, **sans dépendance à
 * transformers.js** — même raison d'être que `duckdb-types.ts` : la palette
 * doit pouvoir s'afficher sans tirer un modèle de plusieurs dizaines de
 * méga-octets dans le lot initial.
 */

import type { Langue } from "./langue";

/**
 * Modèle de vectorisation, partagé par le script de build et le navigateur.
 *
 * **Pourquoi pas `all-MiniLM-L6-v2`**, celui de mon dépôt `mon-rag` ? Parce
 * qu'il est entraîné très majoritairement sur de l'anglais, et que ce corpus
 * est en français. Mesuré sur la question « a-t-il déjà travaillé sur de
 * l'IA ? », il rendait des scores tassés entre 0,36 et 0,38 sur quatre
 * passages sans rapport entre eux : à cet écart, le classement ne veut plus
 * rien dire, et le bon passage ne sortait pas premier.
 *
 * La version multilingue coûte quelques méga-octets de plus et sépare
 * réellement les passages. La fidélité au projet d'origine ne valait pas une
 * recherche qui classe mal.
 *
 * Cette constante est la source unique : si le script de build et le
 * navigateur divergeaient, questions et passages vivraient dans deux espaces
 * vectoriels différents et la similarité ne mesurerait plus rien.
 */
export const MODELE_EMBEDDING = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
export const DIMENSIONS_EMBEDDING = 384;

export type EtapeRag = "inactif" | "modele" | "vecteurs" | "pret" | "echec";

export type Extrait = {
  texte: string;
  source: string;
  href: string;
  /** Similarité cosinus, entre −1 et 1. En pratique : 0,2 à 0,8. */
  score: number;
};

export type Reponse = {
  extraits: Extrait[];
  duree: number;
  /** Rédaction par le modèle serveur, si elle a été demandée et a abouti. */
  redaction?: string;
};

export const LIBELLE_ETAPE_RAG: Record<Langue, Record<EtapeRag, string>> = {
  fr: {
    inactif: "",
    modele: "Téléchargement du modèle…",
    vecteurs: "Chargement du corpus…",
    pret: "Prêt",
    echec: "Échec",
  },
  en: {
    inactif: "",
    modele: "Downloading the model…",
    vecteurs: "Loading the corpus…",
    pret: "Ready",
    echec: "Failed",
  },
};

/**
 * Seuil de pertinence.
 *
 * En dessous, le passage est du bruit : mieux vaut répondre « je n'ai rien
 * là-dessus » que d'exhiber le passage le moins mauvais d'un corpus qui ne
 * traite pas le sujet. C'est le principal défaut des démonstrations de RAG,
 * et il se corrige avec une comparaison.
 */
export const SEUIL_PERTINENCE = 0.22;

export const QUESTIONS_TYPES: Record<Langue, string[]> = {
  fr: [
    "Qu'est-ce qu'il sait faire en données ?",
    "A-t-il déjà travaillé sur de l'IA ?",
    "Comment vérifie-t-il que son code est juste ?",
    "Quel est son projet le plus abouti ?",
    "Travaille-t-il avec des agents de code ?",
    "Quelle est sa formation ?",
  ],
  en: [
    "What can he actually do with data?",
    "Has he worked on AI?",
    "How does he check that his code is correct?",
    "What is his most accomplished project?",
    "Does he work with coding agents?",
    "What did he study?",
  ],
};
