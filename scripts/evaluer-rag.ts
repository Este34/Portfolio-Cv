/**
 * Note le moteur de recherche sur le jeu d'évaluation versionné.
 *
 * ## Pourquoi au build et pas dans le navigateur
 *
 * Les deux, en réalité. Ce script produit `public/data/evaluation-*.json`, que
 * la page affiche immédiatement, sans JavaScript, et qu'un moteur d'indexation
 * peut lire. La page propose ensuite de **tout recalculer dans le navigateur**,
 * avec le même modèle et les mêmes vecteurs.
 *
 * C'est la seule forme de publication de résultats qui vaille quelque chose
 * sur un portfolio : un chiffre qu'un lecteur peut refaire tourner sur sa
 * propre machine, et voir tomber sur le même nombre.
 *
 * ## Ce qu'il ne fait pas
 *
 * Il ne régénère pas les vecteurs : il lit ceux qui sont versionnés, comme le
 * fait le navigateur. Mesurer sur des vecteurs recalculés à l'instant
 * décrirait un site qui n'est pas celui qui est servi.
 *
 * Usage : npm run evaluer:rag
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pipeline } from "@huggingface/transformers";

import { EVALUATIONS } from "../src/content/evaluations.ts";
import {
  noter,
  rangPremierAttendu,
  SEUILS_BALAYES,
  type CasPublie,
  type Evaluation,
  type PointSeuil,
} from "../src/lib/evaluation.ts";
import { LANGUES, t, type Langue } from "../src/lib/langue.ts";
import { classer } from "../src/lib/rag.ts";
import { MODELE_EMBEDDING, SEUIL_PERTINENCE } from "../src/lib/rag-types.ts";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const dossier = join(racine, "public", "data");

/** Passages rendus au maximum, identique à ce que la console utilise. */
const K = 4;

type Meta = {
  modele: string;
  dimensions: number;
  passages: { id: string; texte: string; source: string; href: string; poids: number }[];
};

const extracteur = await pipeline("feature-extraction", MODELE_EMBEDDING);
const vectoriser = async (texte: string) => {
  const sortie = await extracteur(texte, { pooling: "mean", normalize: true });
  return sortie.data as Float32Array;
};

for (const langue of LANGUES as readonly Langue[]) {
  const meta = JSON.parse(await readFile(join(dossier, `embeddings-${langue}.json`), "utf8")) as Meta;
  const brut = await readFile(join(dossier, `embeddings-${langue}.bin`));
  const vecteurs = new Float32Array(brut.buffer, brut.byteOffset, brut.byteLength / 4);

  const connus = new Set(meta.passages.map((p) => p.id));
  const inconnus = EVALUATIONS.flatMap((c) => c.attendus).filter((id) => !connus.has(id));
  if (inconnus.length > 0) {
    // Un attendu qui ne correspond à aucun passage fausserait le rappel vers le
    // bas sans qu'on sache pourquoi. Autant refuser de produire le fichier.
    console.error(`\n✗ [${langue}] attendus inconnus du corpus : ${inconnus.join(", ")}\n`);
    process.exit(1);
  }

  const cas: CasPublie[] = [];
  const vecteursQuestions: Float32Array[] = [];

  for (const c of EVALUATIONS) {
    const q = await vectoriser(t(c.question, langue));
    vecteursQuestions.push(q);
    const extraits = classer(q, vecteurs, meta.passages, meta.dimensions, K);
    const rendus = extraits.map((e) => ({
      id: e.id,
      source: e.source,
      score: Number(e.score.toFixed(4)),
      attendu: c.attendus.includes(e.id),
    }));

    cas.push({
      id: c.id,
      rendus,
      attendus: [...c.attendus],
      manques: c.attendus.filter((id) => !rendus.some((r) => r.id === id)),
      rang: rangPremierAttendu({ id: c.id, rendus: rendus.map((r) => r.id), attendus: c.attendus }),
    });
  }

  const bilan = noter(
    cas.map((c) => ({ id: c.id, rendus: c.rendus.map((r) => r.id), attendus: c.attendus })),
    K,
  );

  /*
   * Le balayage du seuil, sur les mêmes vecteurs de question.
   *
   * Les questions sont déjà vectorisées : rejouer le classement à huit seuils
   * ne coûte que du produit scalaire. Sans cette courbe, la valeur retenue
   * serait un nombre posé dans un fichier ; avec elle, c'est un point choisi
   * sur un compromis qu'on peut voir.
   */
  const courbe: PointSeuil[] = SEUILS_BALAYES.map((seuil) => {
    const rejoue = EVALUATIONS.map((c, i) => ({
      id: c.id,
      rendus: classer(vecteursQuestions[i], vecteurs, meta.passages, meta.dimensions, K, seuil).map(
        (e) => e.id,
      ),
      attendus: c.attendus,
    }));
    const b = noter(rejoue, K);
    return {
      seuil,
      rappel: Number(b.rappel.toFixed(4)),
      silence: Number(b.silence.toFixed(4)),
      precision: Number(b.precision.toFixed(4)),
    };
  });

  const evaluation: Evaluation = {
    langue,
    modele: meta.modele,
    passages: meta.passages.length,
    seuil: SEUIL_PERTINENCE,
    bilan,
    courbe,
    cas,
  };

  await writeFile(
    join(dossier, `evaluation-${langue}.json`),
    JSON.stringify(evaluation, null, 2) + "\n",
    "utf8",
  );

  const pc = (v: number) => `${(v * 100).toFixed(0)} %`;
  console.log(
    `\n[${langue}] ${cas.length} cas — rappel@${K} ${pc(bilan.rappel)} · ` +
      `MRR ${bilan.mrr.toFixed(2)} · précision ${pc(bilan.precision)} · silence ${pc(bilan.silence)}`,
  );

  console.log("  seuil   rappel  silence  précision");
  for (const pt of courbe) {
    const marque = pt.seuil === SEUIL_PERTINENCE ? " ←" : "";
    console.log(
      `  ${pt.seuil.toFixed(2)}    ${pc(pt.rappel).padStart(5)}   ${pc(pt.silence).padStart(5)}    ${pc(pt.precision).padStart(5)}${marque}`,
    );
  }

  const rates = cas.filter((c) => (c.attendus.length === 0 ? c.rendus.length > 0 : c.rang === 0));
  if (rates.length === 0) console.log("  aucun échec");
  for (const r of rates) {
    console.log(
      `  ✗ ${r.id.padEnd(22)} ${
        r.attendus.length === 0
          ? `a cité ${r.rendus.map((x) => x.id).join(", ")}`
          : `n'a trouvé aucun de : ${r.attendus.join(", ")}`
      }`,
    );
  }
}

console.log("");
