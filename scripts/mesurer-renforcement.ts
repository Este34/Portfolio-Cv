/**
 * Banc de mesure de la politique apprise.
 *
 * Ce script ne sert pas au build. Il existe parce que les chiffres affichés sur
 * la page du labo doivent être des mesures et non des impressions : « l'agent
 * fait mieux que le hasard » est une phrase qu'on peut écrire sans rien
 * vérifier, et qui est fausse une fois sur deux quand on la vérifie.
 *
 * Il produit trois choses :
 *
 *  1. les deux étalons, hasard et heuristique, sur les mêmes mondes ;
 *  2. la courbe d'apprentissage de la politique, relevée par paliers ;
 *  3. l'ablation de la prime d'entropie, qui est la seule justification
 *     acceptable de sa présence dans le code.
 *
 * Usage : node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/mesurer-renforcement.ts
 */

import { creerAlea } from "../src/lib/mlp.ts";
import {
  ENTROPIE,
  LOT_EPISODES,
  apprendrePolitique,
  avantPolitique,
  decideurAleatoire,
  decideurPolitique,
  evaluer,
  heuristique,
  initialiserPolitique,
  jouerEpisode,
  type Politique,
} from "../src/lib/renforcement.ts";

/** Épisodes par évaluation. Assez pour que l'écart-type de la moyenne soit petit. */
const EVAL = 240;
/** Graine des mondes d'évaluation, fixe : les trois politiques jouent les mêmes. */
const GRAINE_EVAL = 20260819;
/** Épisodes d'entraînement. */
const ENTRAINEMENT = 4000;
/** Relevé tous les combien d'épisodes. */
const PALIER = 500;

const nb = (v: number, d = 1) => v.toFixed(d).padStart(6);
const ligne = (m: { secondes: number; masse: number; survie: number }) =>
  `survie ${nb(m.secondes)} s   masse ${nb(m.masse)}   épisodes finis ${nb(m.survie)} %`;

function entrainer(
  graine: number,
  episodes: number,
  reglages: { entropie?: number } = {},
  surPalier?: (vus: number, pol: Politique) => void,
): Politique {
  const alea = creerAlea(graine);
  const pol = initialiserPolitique(alea);
  let vus = 0;

  while (vus < episodes) {
    const lot = [];
    for (let i = 0; i < LOT_EPISODES; i++) lot.push(jouerEpisode(pol, alea));
    apprendrePolitique(pol, lot, reglages);
    vus += LOT_EPISODES;
    if (surPalier && vus % PALIER < LOT_EPISODES) surPalier(vus, pol);
  }
  return pol;
}

/* ---- Calibrage ---------------------------------------------------------- */

const t0 = performance.now();
const polTest = initialiserPolitique(creerAlea(1));
for (let i = 0; i < 20; i++) jouerEpisode(polTest, creerAlea(i + 1));
const msEpisode = (performance.now() - t0) / 20;
console.log(`\nCoût d'un épisode : ${msEpisode.toFixed(2)} ms`);
console.log(`Budget de 6 ms par image : ${(6 / msEpisode).toFixed(1)} épisodes\n`);

/* ---- Étalons ------------------------------------------------------------ */

const hasard = evaluer(decideurAleatoire(creerAlea(7)), EVAL, GRAINE_EVAL);
const regle = evaluer(heuristique, EVAL, GRAINE_EVAL);

console.log(`Étalons, sur ${EVAL} mondes identiques`);
console.log(`  hasard        ${ligne(hasard)}`);
console.log(`  heuristique   ${ligne(regle)}
`);

/* ---- Apprentissage ------------------------------------------------------ */

console.log(`Apprentissage, ${ENTRAINEMENT} épisodes, prime d'entropie ${ENTROPIE}`);
const debut = performance.now();
const politique = entrainer(42, ENTRAINEMENT, {}, (vus, pol) => {
  const m = evaluer(decideurPolitique(pol), EVAL, GRAINE_EVAL);
  console.log(`  ${String(vus).padStart(5)} ép.   ${ligne(m)}`);
});
const duree = (performance.now() - debut) / 1000;
const finale = evaluer(decideurPolitique(politique), EVAL, GRAINE_EVAL);
console.log(`  terminé en ${duree.toFixed(1)} s\n`);

/* ---- Ablation de la prime d'entropie ------------------------------------ */

console.log("Ablation : la même chose sans prime d'entropie");
const sansPrime = entrainer(42, ENTRAINEMENT, { entropie: 0 });
const mesureSans = evaluer(decideurPolitique(sansPrime), EVAL, GRAINE_EVAL);
console.log(`  ${String(ENTRAINEMENT).padStart(5)} ép.   ${ligne(mesureSans)}`);

/* ---- Concentration de la politique -------------------------------------- */

/*
 * Une politique effondrée se reconnaît à son entropie moyenne : huit directions
 * équiprobables donnent ln 8 ≈ 2,08 ; une seule direction certaine donne 0.
 */
function entropieMoyenne(pol: Politique): number {
  const alea = creerAlea(99);
  const ep = jouerEpisode(pol, alea);
  let total = 0;
  for (const tr of ep.transitions) {
    const { p } = avantPolitique(pol, tr.etat);
    for (let a = 0; a < p.length; a++) if (p[a] > 1e-12) total -= p[a] * Math.log(p[a]);
  }
  return total / Math.max(ep.transitions.length, 1);
}

console.log(`\nEntropie moyenne de la politique (maximum ln 8 = ${Math.log(8).toFixed(2)})`);
console.log(`  avec prime    ${entropieMoyenne(politique).toFixed(3)}`);
console.log(`  sans prime    ${entropieMoyenne(sansPrime).toFixed(3)}`);

/* ---- Verdict ------------------------------------------------------------ */

console.log("\nRécapitulatif");
console.log(`  hasard        ${nb(hasard.secondes)}`);
console.log(`  apprise       ${nb(finale.secondes)}`);
console.log(`  heuristique   ${nb(regle.secondes)}`);
console.log(
  `\n  La politique apprise fait ${(finale.secondes / Math.max(hasard.secondes, 1e-9)).toFixed(2)}× le hasard, ` +
    `et ${((finale.secondes / Math.max(regle.secondes, 1e-9)) * 100).toFixed(0)} % de l'heuristique.\n`,
);
