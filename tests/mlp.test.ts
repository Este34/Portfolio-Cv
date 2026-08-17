import { describe, expect, it } from "vitest";

import {
  H,
  LOT,
  apprendre,
  avant,
  creerAlea,
  initialiser,
  justesse,
  spirales,
  type Exemple,
} from "../src/lib/mlp.ts";

/**
 * Tests du perceptron écrit à la main.
 *
 * Le défaut redouté ici n'est pas un plantage : c'est un réseau qui tourne,
 * affiche une animation convaincante, et n'apprend rien. Une erreur de signe
 * dans la passe arrière suffit — elle ne lève aucune exception et ne se voit pas
 * à l'œil. Ces tests entraînent réellement le réseau et vérifient qu'il
 * converge.
 */

function entrainer(pas: number) {
  const alea = creerAlea(20260817);
  const reseau = initialiser(alea);
  const donnees = spirales(alea);
  let curseur = 0;
  let derniere = 0;

  for (let n = 0; n < pas; n++) {
    const lot: Exemple[] = [];
    for (let i = 0; i < LOT; i++) lot.push(donnees[curseur++ % donnees.length]);
    derniere = apprendre(reseau, lot);
  }
  return { reseau, donnees, perte: derniere };
}

describe("passe avant", () => {
  it("rend une probabilité dans ]0, 1[", () => {
    const r = initialiser(creerAlea(1));
    for (const [x, y] of [
      [0, 0],
      [1, 1],
      [-1, -1],
      [40, -40], // valeurs extrêmes : la sigmoïde ne doit pas déborder
    ]) {
      const { a3 } = avant(r, x, y);
      expect(Number.isFinite(a3)).toBe(true);
      expect(a3).toBeGreaterThan(0);
      expect(a3).toBeLessThan(1);
    }
  });

  it("produit des activations bornées par la tangente hyperbolique", () => {
    const { a1, a2 } = avant(initialiser(creerAlea(7)), 0.4, -0.8);
    expect(a1).toHaveLength(H);
    expect(a2).toHaveLength(H);
    for (const v of [...a1, ...a2]) expect(Math.abs(v)).toBeLessThanOrEqual(1);
  });

  it("est déterministe à graine fixée", () => {
    const a = avant(initialiser(creerAlea(42)), 0.3, 0.6).a3;
    const b = avant(initialiser(creerAlea(42)), 0.3, 0.6).a3;
    expect(a).toBe(b);
  });
});

describe("jeu de données", () => {
  it("produit deux classes équilibrées dans le domaine attendu", () => {
    const d = spirales(creerAlea(3));
    expect(d.filter((e) => e.classe === 0)).toHaveLength(90);
    expect(d.filter((e) => e.classe === 1)).toHaveLength(90);
    for (const e of d) {
      expect(Math.abs(e.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(e.y)).toBeLessThanOrEqual(1);
    }
  });

  it("résiste à tout classifieur linéaire", () => {
    /*
     * Balayage exhaustif : orientations, seuils et les deux polarités. Omettre
     * la polarité sous-estime le plafond — c'est l'erreur qui m'avait fait
     * mesurer 70 % là où une régression logistique atteignait 93 %.
     *
     * Le seuil de 80 % est la garantie que la démonstration démontre bien
     * l'apport des couches cachées : si une droite y suffisait, le réseau ne
     * prouverait rien.
     */
    const donnees = spirales(creerAlea(3));
    let meilleur = 0;
    for (let deg = 0; deg < 180; deg += 1) {
      const t = (deg * Math.PI) / 180;
      const ux = Math.cos(t);
      const uy = Math.sin(t);
      for (let seuil = -1.5; seuil <= 1.5; seuil += 0.02) {
        let bons = 0;
        for (const e of donnees) if ((e.x * ux + e.y * uy >= seuil ? 1 : 0) === e.classe) bons++;
        meilleur = Math.max(meilleur, bons, donnees.length - bons);
      }
    }
    expect((meilleur / donnees.length) * 100).toBeLessThan(80);
  });
});

describe("apprentissage", () => {
  it("part d'une justesse de hasard", () => {
    const alea = creerAlea(20260817);
    const r = initialiser(alea);
    const d = spirales(alea);
    expect(justesse(r, d)).toBeLessThan(75);
  });

  it("fait décroître la perte", () => {
    const debut = entrainer(20);
    const fin = entrainer(1500);
    expect(fin.perte).toBeLessThan(debut.perte);
  });

  it("sépare les deux spirales", () => {
    // Le seuil vise le défaut réel — un réseau qui n'apprend pas plafonne
    // vers 50 % — sans exiger une convergence parfaite qui rendrait le test
    // fragile.
    const { reseau, donnees } = entrainer(20000);
    expect(justesse(reseau, donnees)).toBeGreaterThan(90);
  });

  it("ne produit ni NaN ni infini après un long entraînement", () => {
    const { reseau } = entrainer(4000);
    const poids = [
      ...reseau.w1,
      ...reseau.b1,
      ...reseau.w2,
      ...reseau.b2,
      ...reseau.w3,
      ...reseau.b3,
    ];
    for (const p of poids) expect(Number.isFinite(p)).toBe(true);
  });

  it("reste reproductible d'une exécution à l'autre", () => {
    expect(entrainer(600).perte).toBe(entrainer(600).perte);
  });
});
