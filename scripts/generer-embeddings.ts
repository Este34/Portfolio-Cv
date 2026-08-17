/**
 * Calcule les vecteurs du corpus au build et les écrit en binaire.
 *
 * Le modèle employé — `Xenova/all-MiniLM-L6-v2`, 384 dimensions — est le même
 * que celui de mon dépôt `mon-rag`. Le navigateur chargera exactement le même
 * modèle pour vectoriser la question : sans cela, question et passages
 * vivraient dans deux espaces différents et la similarité ne voudrait rien
 * dire.
 *
 * ## Format de sortie
 *
 * `embeddings.bin` : Float32 bruts, `n × 384`, concaténés, sans en-tête.
 * `embeddings.json` : les métadonnées des passages, dans le même ordre.
 *
 * Du binaire plutôt que du JSON parce qu'un flottant sérialisé en texte coûte
 * environ quatre fois sa taille utile, et qu'il faudrait ensuite le reparser
 * nombre par nombre. Ici, un seul `new Float32Array(buffer)` suffit.
 *
 * Les vecteurs sont normalisés à l'écriture : la similarité cosinus se réduit
 * alors à un produit scalaire, sans division ni racine au moment de la requête.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pipeline } from "@huggingface/transformers";

import { construireCorpus } from "../src/content/corpus.ts";
import { DIMENSIONS_EMBEDDING, MODELE_EMBEDDING } from "../src/lib/rag-types.ts";

const MODELE = MODELE_EMBEDDING;
const DIMENSIONS = DIMENSIONS_EMBEDDING;

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const dossier = join(racine, "public", "data");

const corpus = construireCorpus();
console.log(`Corpus : ${corpus.length} passages`);

const vectoriser = await pipeline("feature-extraction", MODELE);

const vecteurs = new Float32Array(corpus.length * DIMENSIONS);

for (const [i, passage] of corpus.entries()) {
  const sortie = await vectoriser(passage.texte, { pooling: "mean", normalize: true });
  const v = sortie.data as Float32Array;

  if (v.length !== DIMENSIONS) {
    throw new Error(`Dimension inattendue pour « ${passage.id} » : ${v.length} au lieu de ${DIMENSIONS}`);
  }
  vecteurs.set(v, i * DIMENSIONS);

  if ((i + 1) % 10 === 0 || i === corpus.length - 1) {
    process.stdout.write(`\r  vectorisé ${i + 1}/${corpus.length}`);
  }
}
process.stdout.write("\n");

/*
 * Contrôle de cohérence : un vecteur normalisé a une norme de 1. Si le
 * `normalize: true` cessait d'être appliqué par une version future de la
 * bibliothèque, la recherche se dégraderait en silence — mieux vaut échouer
 * ici, au build, que servir des résultats subtilement faux.
 */
for (let i = 0; i < corpus.length; i++) {
  let somme = 0;
  for (let d = 0; d < DIMENSIONS; d++) {
    const x = vecteurs[i * DIMENSIONS + d];
    somme += x * x;
  }
  const norme = Math.sqrt(somme);
  if (Math.abs(norme - 1) > 1e-3) {
    throw new Error(`Vecteur non normalisé pour « ${corpus[i].id} » : norme ${norme.toFixed(4)}`);
  }
}

/* ---------------------------------------------------------------------------
   Projection en deux dimensions, par analyse en composantes principales.
   --------------------------------------------------------------------------- */

/**
 * Extrait les deux premières composantes principales par itération de la
 * puissance, puis projette chaque passage dessus.
 *
 * **Pourquoi l'ACP et pas t-SNE ou UMAP.** Ces derniers donnent de plus jolis
 * amas, mais ils inventent une structure locale : deux points voisins sur un
 * graphe t-SNE ne le sont pas nécessairement dans l'espace d'origine, et les
 * distances entre amas n'ont aucun sens. Une ACP est une projection linéaire —
 * ce qu'on voit est une ombre fidèle du nuage réel, avec la part de variance
 * qu'elle conserve écrite noir sur blanc. Sur un site qui prétend montrer son
 * moteur de recherche au travail, une figure honnête vaut mieux qu'une belle.
 *
 * Le vecteur de départ est fixe et non aléatoire : deux builds successifs
 * doivent produire exactement la même figure.
 */
function projeterACP(v: Float32Array, n: number, d: number) {
  const moyenne = new Float64Array(d);
  for (let i = 0; i < n; i++) for (let k = 0; k < d; k++) moyenne[k] += v[i * d + k];
  for (let k = 0; k < d; k++) moyenne[k] /= n;

  const centre = new Float64Array(n * d);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < d; k++) centre[i * d + k] = v[i * d + k] - moyenne[k];
  }

  /** Une itération de la puissance sur la matrice de covariance implicite. */
  function composante(exclure: Float64Array | null): Float64Array {
    let u = new Float64Array(d).fill(1 / Math.sqrt(d));
    for (let pas = 0; pas < 120; pas++) {
      const suivant = new Float64Array(d);
      for (let i = 0; i < n; i++) {
        let produit = 0;
        for (let k = 0; k < d; k++) produit += centre[i * d + k] * u[k];
        for (let k = 0; k < d; k++) suivant[k] += produit * centre[i * d + k];
      }
      // Déflation : on retire la part portée par la composante précédente,
      // sinon l'itération reconverge simplement vers elle.
      if (exclure) {
        let produit = 0;
        for (let k = 0; k < d; k++) produit += suivant[k] * exclure[k];
        for (let k = 0; k < d; k++) suivant[k] -= produit * exclure[k];
      }
      let norme = 0;
      for (let k = 0; k < d; k++) norme += suivant[k] * suivant[k];
      norme = Math.sqrt(norme) || 1;
      for (let k = 0; k < d; k++) suivant[k] /= norme;
      u = suivant;
    }
    return u;
  }

  const pc1 = composante(null);
  const pc2 = composante(pc1);

  const brut: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    for (let k = 0; k < d; k++) {
      x += centre[i * d + k] * pc1[k];
      y += centre[i * d + k] * pc2[k];
    }
    brut.push([x, y]);
  }

  // Ramené dans [0, 1] : le composant de rendu n'a plus à connaître l'échelle.
  const xs = brut.map((p) => p[0]);
  const ys = brut.map((p) => p[1]);
  const etendue = (a: number[]) => {
    const min = Math.min(...a);
    const max = Math.max(...a);
    return { min, ecart: max - min || 1 };
  };
  const ex = etendue(xs);
  const ey = etendue(ys);

  // Part de variance conservée : la seule mesure qui dise si la figure est
  // informative ou décorative.
  let varianceTotale = 0;
  for (let i = 0; i < n * d; i++) varianceTotale += centre[i] * centre[i];
  const varianceProjetee = brut.reduce((s, [x, y]) => s + x * x + y * y, 0);

  return {
    points: brut.map(([x, y]) => [
      Number(((x - ex.min) / ex.ecart).toFixed(4)),
      Number(((y - ey.min) / ey.ecart).toFixed(4)),
    ]) as [number, number][],
    variance: Number(((varianceProjetee / varianceTotale) * 100).toFixed(1)),
  };
}

const projection = projeterACP(vecteurs, corpus.length, DIMENSIONS);
console.log(`Projection ACP : ${projection.variance} % de la variance conservée`);

await mkdir(dossier, { recursive: true });
await writeFile(join(dossier, "embeddings.bin"), Buffer.from(vecteurs.buffer));
await writeFile(
  join(dossier, "embeddings.json"),
  JSON.stringify({
    modele: MODELE,
    dimensions: DIMENSIONS,
    projection,
    passages: corpus.map(({ id, texte, source, href, poids }, i) => ({
      id,
      texte,
      source,
      href,
      poids,
      xy: projection.points[i],
    })),
  }),
);

const kio = (n: number) => `${Math.round(n / 1024)} Kio`;
console.log(
  `✓ embeddings.bin  ${kio(vecteurs.byteLength)} (${corpus.length} × ${DIMENSIONS} flottants)\n` +
    `✓ embeddings.json ${kio(Buffer.byteLength(JSON.stringify(corpus)))}`,
);
