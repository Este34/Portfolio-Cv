import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { creerAlea } from "@/lib/mlp";
import {
  creerPartitionneur,
  meilleureGraine,
  partitionner,
  representants,
} from "@/lib/partition";

/**
 * Le partitionnement du corpus : ce que ces tests attrapent.
 *
 * Une partition cassée produit une figure colorée parfaitement plausible. Les
 * points ont des couleurs, la légende a des noms, et rien à l'écran ne dit que
 * trois groupes sur cinq sont vides ou que les centres ont dérivé hors de la
 * sphère.
 *
 * Deux familles, donc. Des amas fabriqués, où la bonne réponse est connue
 * d'avance, et le vrai corpus, où seules les propriétés structurelles sont
 * vérifiables.
 */

const D = 8;

/** Vecteurs unitaires groupés autour de `k` directions bien séparées. */
function amasArtificiels(k: number, parAmas: number, bruit = 0.05) {
  const alea = creerAlea(7);
  const n = k * parAmas;
  const v = new Float32Array(n * D);
  const verite: number[] = [];

  for (let c = 0; c < k; c++) {
    // Une direction canonique par amas : l'angle entre deux d'entre elles est
    // maximal, donc la partition attendue ne fait aucun doute.
    for (let j = 0; j < parAmas; j++) {
      const i = c * parAmas + j;
      let norme = 0;
      for (let d = 0; d < D; d++) {
        const base = d === c ? 1 : 0;
        const x = base + (alea() * 2 - 1) * bruit;
        v[i * D + d] = x;
        norme += x * x;
      }
      norme = Math.sqrt(norme);
      for (let d = 0; d < D; d++) v[i * D + d] /= norme;
      verite.push(c);
    }
  }
  return { v, n, verite };
}

/** Deux partitions sont identiques à une renumérotation près. */
function memePartition(a: ArrayLike<number>, b: readonly number[]): boolean {
  const table = new Map<number, number>();
  const pris = new Set<number>();
  for (let i = 0; i < b.length; i++) {
    const attendu = table.get(b[i]);
    if (attendu === undefined) {
      if (pris.has(a[i])) return false;
      table.set(b[i], a[i]);
      pris.add(a[i]);
    } else if (attendu !== a[i]) {
      return false;
    }
  }
  return true;
}

describe("sur des amas connus", () => {
  /**
   * Une amorce unique échoue parfois, et ce test l'établit plutôt que de le
   * supposer : sur dix graines, au moins une converge vers un minimum local où
   * deux amas fusionnent. C'est la raison d'être des réamorçages, et sans cette
   * mesure ils passeraient pour une précaution superstitieuse.
   */
  it("échoue sur au moins une graine quand on n'amorce qu'une fois", () => {
    const { v, n, verite } = amasArtificiels(4, 9);
    const exactes = Array.from({ length: 10 }, (_, i) =>
      memePartition(partitionner(v, n, D, 4, i + 1).affectations, verite),
    );
    expect(exactes.every(Boolean)).toBe(false);
    // Mais la grande majorité réussit : k-moyennes++ sert bien à quelque chose.
    expect(exactes.filter(Boolean).length).toBeGreaterThanOrEqual(8);
  });

  it("retrouve exactement la partition dès qu'on réamorce", () => {
    const { v, n, verite } = amasArtificiels(4, 9);
    for (let depart = 1; depart <= 12; depart++) {
      const { graine } = meilleureGraine(
        v,
        n,
        D,
        4,
        Array.from({ length: 8 }, (_, i) => depart + i * 7919),
      );
      const r = partitionner(v, n, D, 4, graine);
      expect(r.converge, `depart ${depart}`).toBe(true);
      expect(memePartition(r.affectations, verite), `depart ${depart}`).toBe(true);
    }
  });

  it("garde les centres sur la sphère", () => {
    /*
     * Le défaut que ce test attrape : sans renormalisation après déplacement,
     * les centres dérivent vers l'intérieur, leur norme tombe, ils attirent de
     * moins en moins de points, et les groupes se vident les uns après les
     * autres — sans qu'aucune erreur ne soit levée.
     */
    const { v, n } = amasArtificiels(5, 8);
    const r = partitionner(v, n, D, 5, 3);
    for (let c = 0; c < 5; c++) {
      let norme = 0;
      for (let d = 0; d < D; d++) norme += r.centres[c * D + d] ** 2;
      expect(Math.sqrt(norme)).toBeCloseTo(1, 5);
    }
  });

  it("ne laisse aucun groupe vide quand il y a de quoi les remplir", () => {
    const { v, n } = amasArtificiels(5, 8);
    for (let graine = 1; graine <= 10; graine++) {
      const r = partitionner(v, n, D, 5, graine);
      const tailles = new Array(5).fill(0);
      for (const c of r.affectations) tailles[c]++;
      expect(Math.min(...tailles), `graine ${graine}`).toBeGreaterThan(0);
    }
  });

  it("fait décroître l'inertie à chaque itération", () => {
    const { v, n } = amasArtificiels(4, 10);
    const p = creerPartitionneur(v, n, D, 4, 5);
    let precedente = Infinity;
    while (!p.converge && p.iterations < 30) {
      p.avancer();
      // Lloyd est monotone : une inertie qui remonte est le signe qu'un centre
      // a été recalculé avant l'affectation, ou l'inverse.
      expect(p.inertie).toBeLessThanOrEqual(precedente + 1e-9);
      precedente = p.inertie;
    }
    expect(p.converge).toBe(true);
  });

  it("désigne un représentant réellement central", () => {
    const { v, n, verite } = amasArtificiels(3, 12);
    const r = partitionner(v, n, D, 3, 2);
    const reps = representants(v, r.affectations, r.centres, n, D, 3);

    for (let c = 0; c < 3; c++) {
      expect(reps[c]).toBeGreaterThanOrEqual(0);
      // Le représentant appartient à son propre groupe, et à l'amas d'origine
      // que ce groupe recouvre.
      expect(r.affectations[reps[c]]).toBe(c);
      const membres = [...r.affectations].map((a, i) => (a === c ? verite[i] : -1)).filter((x) => x >= 0);
      expect(membres).toContain(verite[reps[c]]);
    }
  });

  it("est reproductible à graine égale", () => {
    const { v, n } = amasArtificiels(4, 9);
    const a = partitionner(v, n, D, 4, 42);
    const b = partitionner(v, n, D, 4, 42);
    expect([...a.affectations]).toEqual([...b.affectations]);
    expect(a.inertie).toBeCloseTo(b.inertie, 12);
  });
});

describe("sur le vrai corpus", () => {
  const dossier = join(process.cwd(), "public", "data");
  const meta = JSON.parse(readFileSync(join(dossier, "embeddings-fr.json"), "utf8")) as {
    dimensions: number;
    passages: { id: string; source: string }[];
  };
  const brut = readFileSync(join(dossier, "embeddings-fr.bin"));
  const vecteurs = new Float32Array(brut.buffer, brut.byteOffset, brut.byteLength / 4);
  const n = meta.passages.length;
  const d = meta.dimensions;

  it("converge en quelques itérations, sur toutes les graines", () => {
    // Si une graine demandait trente itérations, l'animation deviendrait
    // interminable à une demi-seconde par tour.
    for (let graine = 1; graine <= 12; graine++) {
      const r = partitionner(vecteurs, n, d, 5, graine);
      expect(r.converge, `graine ${graine}`).toBe(true);
      expect(r.iterations, `graine ${graine}`).toBeLessThanOrEqual(12);
    }
  });

  it("ne rend jamais de groupe vide", () => {
    for (let graine = 1; graine <= 12; graine++) {
      const r = partitionner(vecteurs, n, d, 5, graine);
      const tailles = new Array(5).fill(0);
      for (const c of r.affectations) tailles[c]++;
      expect(Math.min(...tailles), `graine ${graine}`).toBeGreaterThan(0);
    }
  });

  /**
   * Ce que la démonstration prétend montrer, vérifié.
   *
   * La page affirme que les groupes trouvés recoupent largement les sources
   * déclarées. Si le partitionnement mélangeait tout, la figure resterait jolie
   * et la phrase deviendrait fausse. On mesure donc la pureté : la part de
   * passages appartenant à la source majoritaire de leur groupe.
   *
   * Le seuil est posé à 0,5, bien en dessous de ce qui est constaté, parce
   * qu'un corpus qui gagne une page peut légitimement se regrouper autrement.
   */
  it("retrouve largement le découpage par source", () => {
    const r = partitionner(vecteurs, n, d, 5, 1);
    let majoritaires = 0;
    for (let c = 0; c < 5; c++) {
      const comptes = new Map<string, number>();
      for (let i = 0; i < n; i++) {
        if (r.affectations[i] !== c) continue;
        const s = meta.passages[i].source;
        comptes.set(s, (comptes.get(s) ?? 0) + 1);
      }
      majoritaires += Math.max(0, ...comptes.values());
    }
    expect(majoritaires / n).toBeGreaterThan(0.5);
  });
});
