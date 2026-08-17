/**
 * Vérifie que les vecteurs versionnés correspondent au contenu actuel.
 *
 * **Pourquoi ce script existe plutôt qu'une régénération.** Régénérer les
 * vecteurs à chaque build imposerait de télécharger le modèle dans
 * l'environnement de build — quelques dizaines de méga-octets, à chaque
 * déploiement, pour un résultat identique à celui déjà versionné. Les vecteurs
 * sont donc un artefact du dépôt, et le build se contente de refuser de partir
 * s'ils ne collent plus au contenu.
 *
 * Ce contrôle est volontairement rapide et sans modèle : il compare les
 * identifiants et les textes, pas les valeurs numériques. Un texte modifié sans
 * régénération produirait un site qui affiche un extrait tout en le comparant
 * au vecteur de l'ancien — l'erreur la plus difficile à voir, parce qu'elle ne
 * casse rien.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { construireCorpus } from "../src/content/corpus.ts";
import { DIMENSIONS_EMBEDDING, MODELE_EMBEDDING } from "../src/lib/rag-types.ts";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const dossier = join(racine, "public", "data");

function echouer(message: string): never {
  console.error(`\n✗ ${message}`);
  console.error("  Lancer : npm run generer:embeddings\n");
  process.exit(1);
}

let meta: {
  modele: string;
  dimensions: number;
  passages: { id: string; texte: string }[];
};
let octets: number;

try {
  meta = JSON.parse(await readFile(join(dossier, "embeddings.json"), "utf8"));
  octets = (await readFile(join(dossier, "embeddings.bin"))).byteLength;
} catch {
  echouer("Vecteurs absents de public/data/.");
}

const corpus = construireCorpus();

if (meta.modele !== MODELE_EMBEDDING) {
  echouer(`Modèle périmé : « ${meta.modele} » au lieu de « ${MODELE_EMBEDDING} ».`);
}

if (meta.dimensions !== DIMENSIONS_EMBEDDING) {
  echouer(`Dimensions périmées : ${meta.dimensions} au lieu de ${DIMENSIONS_EMBEDDING}.`);
}

const attendu = corpus.length * DIMENSIONS_EMBEDDING * 4;
if (octets !== attendu) {
  echouer(`Binaire incohérent : ${octets} octets au lieu de ${attendu} pour ${corpus.length} passages.`);
}

if (meta.passages.length !== corpus.length) {
  echouer(`${meta.passages.length} passages vectorisés pour ${corpus.length} dans le contenu.`);
}

for (const [i, p] of corpus.entries()) {
  if (meta.passages[i].id !== p.id) {
    echouer(`Passage ${i} : identifiant « ${meta.passages[i].id} » au lieu de « ${p.id} ».`);
  }
  if (meta.passages[i].texte !== p.texte) {
    echouer(`Le texte du passage « ${p.id} » a changé depuis la dernière vectorisation.`);
  }
}

console.log(`✓ Vecteurs à jour — ${corpus.length} passages, ${MODELE_EMBEDDING}`);
