/**
 * Partitionnement du corpus, sur les vraies coordonnées.
 *
 * Le nuage de la page d'accueil colore chaque passage par sa **source** : la
 * page dont il vient. C'est une information vraie, mais c'est une information
 * que j'ai écrite. Rien, dans cette figure, ne dit si le modèle voit la même
 * chose que moi.
 *
 * Ce module répond à cette question en cherchant des groupes que personne n'a
 * déclarés, par k-moyennes sphériques sur les 384 dimensions — pas sur la
 * projection affichée, qui n'en retient qu'un tiers. La comparaison des deux
 * colorations est le propos : là où elles coïncident, le découpage éditorial
 * du corpus correspond à sa géométrie ; là où elles divergent, l'une des deux
 * se trompe, et ce n'est pas toujours le modèle.
 *
 * ## Sphériques, et pourquoi ça change quelque chose
 *
 * Les vecteurs sont normalisés, donc la distance euclidienne au carré vaut
 * `2 − 2·cos`. Minimiser l'une revient à maximiser l'autre, et k-moyennes
 * ordinaire trouverait donc les mêmes groupes — **à condition** que les centres
 * restent sur la sphère. Sans renormalisation, un centre dérive vers
 * l'intérieur, sa norme diminue, et il attire de moins en moins de points : les
 * groupes se vident les uns après les autres. Le seul geste ajouté est donc une
 * division par la norme après chaque déplacement.
 *
 * ## Ce module ne rend rien
 *
 * Comme `mlp.ts` et `renforcement.ts`, pour la même raison : une partition qui
 * ne converge pas, ou qui perd un groupe en route, produit une figure colorée
 * parfaitement plausible.
 */

import { creerAlea } from "./mlp.ts";

export type Partition = {
  /** Numéro de groupe de chaque passage. */
  affectations: Int32Array;
  /** Centres, `k × dimensions`, normalisés. */
  centres: Float32Array;
  /** Somme des distances au carré au centre affecté. */
  inertie: number;
  /** Itérations effectuées. */
  iterations: number;
  /** Vrai si aucune affectation n'a changé au dernier tour. */
  converge: boolean;
};

/** Produit scalaire, qui est le cosinus puisque tout est normalisé. */
function cosinus(a: Float32Array, ia: number, b: Float32Array, ib: number, d: number): number {
  let s = 0;
  for (let i = 0; i < d; i++) s += a[ia + i] * b[ib + i];
  return s;
}

/**
 * Initialisation k-moyennes++.
 *
 * Le premier centre est tiré au hasard, les suivants avec une probabilité
 * proportionnelle au carré de leur distance au centre le plus proche déjà
 * choisi. C'est ce qui évite le défaut visible sur la démonstration de
 * k-moyennes du labo, où une initialisation naïve fait converger deux centres
 * dans le même amas et laisse un amas entier sans centre.
 */
function amorcer(
  vecteurs: Float32Array,
  n: number,
  d: number,
  k: number,
  alea: () => number,
): Float32Array {
  const centres = new Float32Array(k * d);
  const premier = Math.floor(alea() * n);
  centres.set(vecteurs.subarray(premier * d, premier * d + d), 0);

  const distances = new Float64Array(n).fill(Infinity);

  for (let c = 1; c < k; c++) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      // Distance au carré sur la sphère : 2 − 2·cos.
      const dist = 2 - 2 * cosinus(vecteurs, i * d, centres, (c - 1) * d, d);
      if (dist < distances[i]) distances[i] = dist;
      total += distances[i];
    }

    let seuil = alea() * total;
    let choisi = n - 1;
    for (let i = 0; i < n; i++) {
      seuil -= distances[i];
      if (seuil <= 0) {
        choisi = i;
        break;
      }
    }
    centres.set(vecteurs.subarray(choisi * d, choisi * d + d), c * d);
  }

  return centres;
}

/** Renormalise chaque centre. Voir la note d'en-tête sur la dérive. */
function projeterSurLaSphere(centres: Float32Array, k: number, d: number) {
  for (let c = 0; c < k; c++) {
    let norme = 0;
    for (let i = 0; i < d; i++) norme += centres[c * d + i] ** 2;
    norme = Math.sqrt(norme);
    if (norme < 1e-9) continue;
    for (let i = 0; i < d; i++) centres[c * d + i] /= norme;
  }
}

export type Partitionneur = {
  affectations: Int32Array;
  centres: Float32Array;
  inertie: number;
  iterations: number;
  converge: boolean;
  /** Une itération de Lloyd. Renvoie le nombre d'affectations qui ont changé. */
  avancer: () => number;
};

/**
 * Partitionneur pas à pas, pour que la convergence se regarde.
 *
 * Rendre le résultat d'un seul coup priverait la démonstration de son objet :
 * ce qui vaut d'être vu, c'est le nuage qui se recolore trois fois avant de se
 * stabiliser, et le fait que ça prenne une poignée d'itérations et non cent.
 */
export function creerPartitionneur(
  vecteurs: Float32Array,
  n: number,
  d: number,
  k: number,
  graine = 1,
): Partitionneur {
  const alea = creerAlea(graine);
  const centres = amorcer(vecteurs, n, d, k, alea);
  const affectations = new Int32Array(n).fill(-1);

  const p: Partitionneur = {
    affectations,
    centres,
    inertie: Infinity,
    iterations: 0,
    converge: false,
    avancer() {
      if (p.converge) return 0;

      // ---- Affectation ---------------------------------------------------
      let changements = 0;
      let inertie = 0;
      for (let i = 0; i < n; i++) {
        let meilleur = 0;
        let cosMax = -Infinity;
        for (let c = 0; c < k; c++) {
          const cos = cosinus(vecteurs, i * d, centres, c * d, d);
          if (cos > cosMax) {
            cosMax = cos;
            meilleur = c;
          }
        }
        if (affectations[i] !== meilleur) {
          affectations[i] = meilleur;
          changements++;
        }
        inertie += 2 - 2 * cosMax;
      }

      // ---- Déplacement ---------------------------------------------------
      const sommes = new Float32Array(k * d);
      const comptes = new Int32Array(k);
      for (let i = 0; i < n; i++) {
        const c = affectations[i];
        comptes[c]++;
        for (let j = 0; j < d; j++) sommes[c * d + j] += vecteurs[i * d + j];
      }

      for (let c = 0; c < k; c++) {
        /*
         * Un groupe vide garde son centre plutôt que d'être réamorcé.
         *
         * Le réamorcer relancerait la convergence à chaque tour et la figure
         * ne se stabiliserait jamais. Le garder le laisse simplement vide, ce
         * qui est une information : sur ce corpus, cela signifie que `k` est
         * trop grand, et la légende le montre en n'affichant que les groupes
         * peuplés.
         */
        if (comptes[c] === 0) continue;
        for (let j = 0; j < d; j++) centres[c * d + j] = sommes[c * d + j] / comptes[c];
      }
      projeterSurLaSphere(centres, k, d);

      p.inertie = inertie;
      p.iterations++;
      p.converge = changements === 0;
      return changements;
    },
  };

  return p;
}

/** Fait tourner jusqu'à convergence, ou jusqu'au plafond d'itérations. */
export function partitionner(
  vecteurs: Float32Array,
  n: number,
  d: number,
  k: number,
  graine = 1,
  maxIterations = 60,
): Partition {
  const p = creerPartitionneur(vecteurs, n, d, k, graine);
  while (!p.converge && p.iterations < maxIterations) p.avancer();
  return {
    affectations: p.affectations,
    centres: p.centres,
    inertie: p.inertie,
    iterations: p.iterations,
    converge: p.converge,
  };
}

/**
 * L'élément le plus proche du centre de son groupe, qui lui donne son nom.
 *
 * Nommer un groupe par le mot le plus fréquent de ses textes donnerait des
 * étiquettes comme « projet » ou « données », vraies et inutiles. Le passage le
 * plus central, lui, est un objet du corpus : on peut le lire, et vérifier que
 * l'étiquette n'est pas une invention.
 */
export function representants(
  vecteurs: Float32Array,
  affectations: Int32Array,
  centres: Float32Array,
  n: number,
  d: number,
  k: number,
): number[] {
  const meilleurs = new Array<number>(k).fill(-1);
  const scores = new Array<number>(k).fill(-Infinity);

  for (let i = 0; i < n; i++) {
    const c = affectations[i];
    if (c < 0) continue;
    const cos = cosinus(vecteurs, i * d, centres, c * d, d);
    if (cos > scores[c]) {
      scores[c] = cos;
      meilleurs[c] = i;
    }
  }

  return meilleurs;
}

/**
 * Choisit la meilleure amorce parmi plusieurs, par inertie.
 *
 * k-moyennes++ réduit les mauvaises initialisations, il ne les supprime pas.
 * Mesuré sur quatre amas artificiels parfaitement séparés, une graine sur dix
 * converge vers un minimum local où deux amas fusionnent et un troisième se
 * scinde : inertie 10,66 contre 0,18 pour une bonne amorce, soit cinquante-huit
 * fois pire. Rien ne le signale — la partition converge, tous les groupes sont
 * peuplés, et la figure reste jolie.
 *
 * D'où les réamorçages, qui sont la réponse ordinaire à ce problème. Chaque
 * essai coûte moins d'une milliseconde sur cinquante-cinq vecteurs, et l'on
 * garde celui dont l'inertie est la plus basse.
 *
 * Le résultat rendu est la **graine** gagnante et non la partition, pour que
 * l'appelant puisse rejouer la même convergence pas à pas et la donner à voir.
 */
export function meilleureGraine(
  vecteurs: Float32Array,
  n: number,
  d: number,
  k: number,
  graines: readonly number[],
): { graine: number; inertie: number } {
  let meilleure = graines[0] ?? 1;
  let basse = Infinity;

  for (const graine of graines) {
    const { inertie } = partitionner(vecteurs, n, d, k, graine);
    if (inertie < basse) {
      basse = inertie;
      meilleure = graine;
    }
  }

  return { graine: meilleure, inertie: basse };
}
