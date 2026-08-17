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

await mkdir(dossier, { recursive: true });
await writeFile(join(dossier, "embeddings.bin"), Buffer.from(vecteurs.buffer));
await writeFile(
  join(dossier, "embeddings.json"),
  JSON.stringify({
    modele: MODELE,
    dimensions: DIMENSIONS,
    passages: corpus.map(({ id, texte, source, href, poids }) => ({ id, texte, source, href, poids })),
  }),
);

const kio = (n: number) => `${Math.round(n / 1024)} Kio`;
console.log(
  `✓ embeddings.bin  ${kio(vecteurs.byteLength)} (${corpus.length} × ${DIMENSIONS} flottants)\n` +
    `✓ embeddings.json ${kio(Buffer.byteLength(JSON.stringify(corpus)))}`,
);
