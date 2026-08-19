/**
 * Recherche augmentée, exécutée dans le navigateur.
 *
 * C'est le portage web de mon dépôt `mon-rag` : même principe — vectoriser,
 * comparer par similarité cosinus, retenir les meilleurs passages.
 *
 * Trois différences avec la version Python :
 *
 *  1. Le modèle n'est pas le même. Voir `MODELE_EMBEDDING` : celui d'origine
 *     est anglophone et classait mal un corpus français.
 *  2. Les vecteurs du corpus sont calculés au build, pas au démarrage. Le
 *     navigateur ne vectorise que la question — une phrase, quelques
 *     millisecondes.
 *  3. Les vecteurs étant normalisés à l'écriture, la similarité cosinus se
 *     réduit à un produit scalaire. Pas de division, pas de racine.
 *
 * Rien ne quitte la machine du visiteur, sauf s'il demande explicitement une
 * réponse rédigée.
 */

import type { Langue } from "./langue.ts";
import type { Extrait, EtapeRag, Reponse } from "./rag-types.ts";
import { MODELE_EMBEDDING, SEUIL_PERTINENCE } from "./rag-types.ts";

type Meta = {
  langue: Langue;
  modele: string;
  dimensions: number;
  passages: { id: string; texte: string; source: string; href: string; poids: number }[];
};

type Moteur = {
  vectoriser: (texte: string) => Promise<Float32Array>;
  vecteurs: Float32Array;
  meta: Meta;
};

/**
 * Un moteur par langue, mis en cache séparément.
 *
 * Le modèle, lui, n'est téléchargé qu'une fois : `pipeline()` tient son propre
 * cache. Seuls les vecteurs et les métadonnées diffèrent, soit quelques
 * dizaines de kilo-octets.
 */
const promesses = new Map<Langue, Promise<Moteur>>();

export function moteurRag(langue: Langue, surEtape?: (e: EtapeRag) => void): Promise<Moteur> {
  const existante = promesses.get(langue);
  if (existante) return existante;

  const promesse = amorcer(langue, surEtape).catch((erreur) => {
    promesses.delete(langue);
    throw erreur;
  });
  promesses.set(langue, promesse);
  return promesse;
}

async function amorcer(langue: Langue, surEtape?: (e: EtapeRag) => void): Promise<Moteur> {
  surEtape?.("modele");

  const { pipeline } = await import("@huggingface/transformers");

  /*
   * `dtype: "q8"` : les poids quantifiés sur 8 bits divisent le téléchargement
   * par environ quatre. Sur de la recherche sémantique à 384 dimensions, la
   * perte de précision est invisible sur du classement de passages, alors que
   * la différence de poids, elle, se voit au premier chargement.
   */
  const extracteur = await pipeline("feature-extraction", MODELE_EMBEDDING, {
    dtype: "q8",
  });

  surEtape?.("vecteurs");

  const [reponseMeta, reponseBin] = await Promise.all([
    fetch(`/data/embeddings-${langue}.json`),
    fetch(`/data/embeddings-${langue}.bin`),
  ]);
  if (!reponseMeta.ok || !reponseBin.ok) throw new Error("Corpus indisponible");

  const meta = (await reponseMeta.json()) as Meta;
  const vecteurs = new Float32Array(await reponseBin.arrayBuffer());

  const attendu = meta.passages.length * meta.dimensions;
  if (vecteurs.length !== attendu) {
    // Un binaire désynchronisé de ses métadonnées donnerait des réponses
    // absurdes mais plausibles. Autant s'arrêter net.
    throw new Error(`Corpus incohérent : ${vecteurs.length} flottants au lieu de ${attendu}`);
  }

  surEtape?.("pret");

  return {
    meta,
    vecteurs,
    async vectoriser(texte: string) {
      const sortie = await extracteur(texte, { pooling: "mean", normalize: true });
      return sortie.data as Float32Array;
    },
  };
}

/**
 * Cherche les passages les plus proches de la question.
 *
 * Le score est pondéré par le poids du passage : à pertinence égale, un résumé
 * répond mieux qu'un détail. Les passages sous le seuil sont écartés — rendre
 * « le moins mauvais » d'un corpus hors sujet est la façon la plus sûre de
 * faire mentir un moteur de recherche.
 */
const MAX_PAR_SOURCE = 2;

/** Métadonnée minimale nécessaire au classement. */
export type PassageIndexe = {
  id: string;
  texte: string;
  source: string;
  href: string;
  poids: number;
};

/**
 * Classe les passages par proximité à un vecteur de question.
 *
 * Fonction pure, isolée de tout chargement de modèle : c'est elle qui décide
 * de la qualité des réponses, donc c'est elle qu'on teste — en Node, sur les
 * vrais vecteurs produits par le build, sans navigateur ni WebAssembly.
 */
export function classer(
  q: Float32Array,
  vecteurs: Float32Array,
  passages: PassageIndexe[],
  dimensions: number,
  k = 4,
  /*
   * Le seuil est un paramètre, et pas seulement une constante lue ici.
   *
   * Il vaut `SEUIL_PERTINENCE` partout dans le site. Mais le choix de cette
   * valeur est un compromis entre trouver et se taire, et un compromis qu'on
   * ne peut pas balayer est un compromis qu'on a deviné. Le banc d'évaluation
   * fait varier ce paramètre pour tracer la courbe, ce qui est la seule façon
   * de justifier le point retenu.
   */
  seuil = SEUIL_PERTINENCE,
): Extrait[] {
  const scores: Extrait[] = passages.map((p, i) => {
    // Vecteurs normalisés des deux côtés : le produit scalaire EST le cosinus.
    let produit = 0;
    for (let d = 0; d < dimensions; d++) produit += q[d] * vecteurs[i * dimensions + d];

    /*
     * Le poids est appliqué à moitié. Multiplier franchement le cosinus par
     * un coefficient éditorial faisait remonter les passages généraux — la
     * présentation, les résumés — devant le projet précisément visé par la
     * question. Le poids doit départager deux passages à pertinence proche,
     * pas réécrire le classement.
     */
    return {
      id: p.id,
      texte: p.texte,
      source: p.source,
      href: p.href,
      score: produit * (1 + (p.poids - 1) * 0.5),
    };
  });

  scores.sort((a, b) => b.score - a.score);

  /*
   * Diversité des sources.
   *
   * Sans plafond, une section riche en passages proches occupe tout le
   * classement : sur « a-t-il travaillé sur de l'IA ? », deux extraits du
   * parcours suffisaient à évincer le projet de recherche augmentée, qui est
   * pourtant la meilleure réponse. Deux extraits par source au maximum, et
   * les autres sections retrouvent leur place.
   */
  const parSource = new Map<string, number>();
  const retenus: Extrait[] = [];

  for (const s of scores) {
    if (s.score < seuil) break; // La liste est triée : inutile d'aller plus loin.
    const n = parSource.get(s.source) ?? 0;
    if (n >= MAX_PAR_SOURCE) continue;
    parSource.set(s.source, n + 1);
    retenus.push(s);
    if (retenus.length >= k) break;
  }

  return retenus;
}

/**
 * Cherche les passages répondant à une question. Enveloppe `classer` avec le
 * chargement paresseux du modèle et la vectorisation de la question.
 */
export async function chercher(question: string, langue: Langue, k = 4): Promise<Reponse> {
  const moteur = await moteurRag(langue);
  const debut = performance.now();

  const q = await moteur.vectoriser(question);
  const extraits = classer(q, moteur.vecteurs, moteur.meta.passages, moteur.meta.dimensions, k);

  return { extraits, duree: performance.now() - debut };
}

/**
 * Demande une réponse rédigée au modèle serveur, à partir des extraits déjà
 * trouvés localement.
 *
 * Renvoie `null` en cas d'échec — quota, réseau, route absente. L'appelant
 * garde alors les extraits, qui répondent déjà à la question. Une panne de ce
 * service ne doit jamais faire échouer la recherche.
 */
export async function rediger(question: string, extraits: Extrait[]): Promise<string | null> {
  try {
    const reponse = await fetch("/api/rediger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, extraits: extraits.map((e) => e.texte) }),
    });
    if (!reponse.ok) return null;
    const { texte } = (await reponse.json()) as { texte?: string };
    return texte?.trim() || null;
  } catch {
    return null;
  }
}
