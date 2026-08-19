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
  /**
   * Identifiant du passage dans le corpus.
   *
   * Il ne sert à rien à l'affichage, et tout au banc d'évaluation : noter un
   * moteur de recherche suppose de pouvoir dire « ce passage-là est la bonne
   * réponse », ce qu'aucune comparaison de texte ne permet de faire de façon
   * stable.
   */
  id: string;
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
 *
 * ## Pourquoi 0,22 et pas autre chose
 *
 * La valeur a longtemps été posée au jugé. Le banc d'évaluation la balaie
 * désormais sur dix-huit questions dont quatre n'ont volontairement aucune
 * réponse (`npm run evaluer:rag`) :
 *
 *   seuil   rappel   silence   précision      (français)
 *   0,14      71 %      50 %       29 %
 *   0,18      71 %      50 %       30 %
 *   0,22      71 %      75 %       30 %   ← retenu
 *   0,26      71 %      75 %       31 %
 *   0,30      71 %      75 %       32 %
 *   0,34      71 %      75 %       31 %
 *   0,38      57 %      75 %       29 %
 *   0,42      50 %      75 %       30 %
 *
 * 0,22 est **le plus petit seuil qui atteigne le silence maximal** : en
 * dessous, deux questions hors corpus reçoivent une réponse. Au-dessus, rien
 * ne s'améliore jusqu'à 0,38, où le rappel s'effondre. Le point retenu est donc
 * le bord gauche d'un plateau, choisi du côté du rappel — le déplacer vers
 * 0,30 pour un point de précision de plus reviendrait à optimiser sur quatorze
 * questions, ce qui est trop peu pour décider.
 *
 * La courbe dit aussi ce que le seuil **ne peut pas** régler. La question
 * « comment configure-t-il un cluster Kubernetes ? » reçoit une réponse à tous
 * les seuils balayés, y compris 0,42 : le champ lexical de l'infrastructure est
 * assez proche de celui du corpus pour que des passages sans rapport marquent
 * haut. Ce n'est pas un problème de seuil, c'est une limite de la similarité
 * cosinus sur un corpus étroit, et aucun réglage ne la fera disparaître.
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
