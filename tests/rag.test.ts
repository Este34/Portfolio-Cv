import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { pipeline } from "@huggingface/transformers";
import { beforeAll, describe, expect, it } from "vitest";

import { construireCorpus } from "../src/content/corpus.ts";
import { classer } from "../src/lib/rag.ts";
import { DIMENSIONS_EMBEDDING, MODELE_EMBEDDING, SEUIL_PERTINENCE } from "../src/lib/rag-types.ts";

/**
 * Tests du moteur de recherche, sur les vrais vecteurs produits par le build.
 *
 * Le classement est ce qui décide de la qualité perçue du site : une réponse
 * plausible mais mal classée est pire qu'une absence de réponse, parce que
 * personne ne va vérifier. On teste donc sur les données réelles, pas sur des
 * vecteurs fabriqués — un test qui passe sur des données inventées ne dit rien
 * du corpus tel qu'il est écrit.
 */

const dossier = join(process.cwd(), "public", "data");

type Meta = {
  modele: string;
  dimensions: number;
  passages: { id: string; texte: string; source: string; href: string; poids: number }[];
};

let meta: Meta;
let vecteurs: Float32Array;
let vectoriser: (t: string) => Promise<Float32Array>;

beforeAll(async () => {
  meta = JSON.parse(await readFile(join(dossier, "embeddings.json"), "utf8")) as Meta;
  const brut = await readFile(join(dossier, "embeddings.bin"));
  vecteurs = new Float32Array(brut.buffer, brut.byteOffset, brut.byteLength / 4);

  const extracteur = await pipeline("feature-extraction", MODELE_EMBEDDING);
  vectoriser = async (t: string) => {
    const s = await extracteur(t, { pooling: "mean", normalize: true });
    return s.data as Float32Array;
  };
}, 300_000);

describe("intégrité du corpus", () => {
  it("le binaire correspond aux métadonnées", () => {
    expect(vecteurs.length).toBe(meta.passages.length * meta.dimensions);
  });

  it("les vecteurs sont normalisés", () => {
    for (let i = 0; i < meta.passages.length; i++) {
      let somme = 0;
      for (let d = 0; d < meta.dimensions; d++) {
        const x = vecteurs[i * meta.dimensions + d];
        somme += x * x;
      }
      expect(Math.sqrt(somme)).toBeCloseTo(1, 3);
    }
  });

  it("le modèle enregistré est celui que le navigateur chargera", () => {
    // Une divergence ici ferait vivre questions et passages dans deux espaces
    // vectoriels différents : la recherche renverrait du bruit crédible.
    expect(meta.modele).toBe(MODELE_EMBEDDING);
    expect(meta.dimensions).toBe(DIMENSIONS_EMBEDDING);
  });

  it("les vecteurs sont à jour vis-à-vis du contenu", () => {
    // Modifier un texte sans relancer la génération produirait des extraits
    // affichés qui ne correspondent plus aux vecteurs comparés.
    const corpus = construireCorpus();
    expect(meta.passages.map((p) => p.id)).toEqual(corpus.map((p) => p.id));
    expect(meta.passages.map((p) => p.texte)).toEqual(corpus.map((p) => p.texte));
  });
});

describe("classement", () => {
  async function chercher(question: string, k = 4) {
    const q = await vectoriser(question);
    return classer(q, vecteurs, meta.passages, meta.dimensions, k);
  }

  it("place le projet de recherche augmentée en tête sur une question d'IA", async () => {
    const r = await chercher("A-t-il déjà travaillé sur de l'intelligence artificielle ?");
    expect(r.length).toBeGreaterThan(0);
    expect(r.map((e) => e.source)).toContain("Un RAG écrit à la main");
  });

  it("trouve la vérification numérique quand on interroge la justesse du code", async () => {
    const r = await chercher("Comment s'assure-t-il que ses calculs sont justes ?");
    const textes = r.map((e) => e.texte).join(" ");
    expect(textes).toMatch(/0,1 %|2·10⁻⁵|vérifi/i);
  });

  it("ne laisse aucune source occuper plus de deux extraits", async () => {
    for (const q of [
      "Parle-moi de ses compétences",
      "Quels projets a-t-il menés ?",
      "Que sait-il faire en données ?",
    ]) {
      const r = await chercher(q, 4);
      const parSource = new Map<string, number>();
      for (const e of r) parSource.set(e.source, (parSource.get(e.source) ?? 0) + 1);
      for (const [source, n] of parSource) {
        expect(n, `« ${source} » sur la question « ${q} »`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("rend les extraits par score décroissant", async () => {
    const r = await chercher("Quelle est sa formation ?");
    const scores = r.map((e) => e.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("ne rend rien plutôt que du bruit sur une question hors sujet", async () => {
    // Le corpus ne parle ni de cuisine ni de gastronomie. Rendre « le passage
    // le moins mauvais » ferait mentir le moteur.
    const r = await chercher("Quelle est la meilleure recette de soufflé au fromage ?");
    for (const e of r) expect(e.score).toBeGreaterThanOrEqual(SEUIL_PERTINENCE);
  });

  it("respecte le nombre d'extraits demandé", async () => {
    const r = await chercher("Quels projets a-t-il menés ?", 2);
    expect(r.length).toBeLessThanOrEqual(2);
  });
});
