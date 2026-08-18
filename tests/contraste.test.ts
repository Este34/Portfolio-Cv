import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Contraste des jetons de couleur, dans les deux thèmes.
 *
 * ## Pourquoi ce test existe
 *
 * Le site affichait, en thème clair, des annotations à 3,38 contre leur fond —
 * pour un seuil WCAG AA de 4,5 sur du petit texte. Ce n'était pas un cas isolé :
 * la même couleur échouait sur les trois fonds clairs, et l'encre du bouton
 * principal ne donnait que 3,84 sur son aplat corail. Personne ne l'avait vu,
 * parce qu'un contraste insuffisant se lit **presque** bien.
 *
 * Ces rapports se calculent. Les laisser à l'appréciation d'un œil, c'est
 * accepter qu'ils dérivent au prochain ajustement de palette.
 *
 * ## Ce qui est vérifié
 *
 * Les jetons sont lus directement dans la feuille de style, pas recopiés ici :
 * un test qui porte sa propre copie des valeurs finit par vérifier sa copie.
 */

const CSS = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");

/** Extrait les jetons `--nom: #rrggbb;` d'un bloc donné. */
function jetons(selecteur: string): Record<string, string> {
  const debut = CSS.indexOf(selecteur);
  expect(debut, `bloc ${selecteur} introuvable`).toBeGreaterThan(-1);
  const bloc = CSS.slice(debut, CSS.indexOf("\n}", debut));

  const table: Record<string, string> = {};
  for (const [, nom, valeur] of bloc.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    table[nom] = valeur.toLowerCase();
  }
  return table;
}

const canal = (v: number) => {
  const x = v / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

const composantes = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const luminance = (hex: string) => {
  const [r, v, b] = composantes(hex).map(canal);
  return 0.2126 * r + 0.7152 * v + 0.0722 * b;
};

function contraste(avant: string, arriere: string): number {
  const [haut, bas] = [luminance(avant), luminance(arriere)].sort((a, b) => b - a);
  return (haut + 0.05) / (bas + 0.05);
}

/** Seuil WCAG AA pour du texte courant. Le site n'a pas de « grand texte ». */
const SEUIL = 4.5;

describe.each([
  ["clair", ":root {"],
  ["sombre", ".dark {"],
])("contraste, thème %s", (_nom, selecteur) => {
  const j = jetons(selecteur);

  const fonds = [
    ["fond", j.fond],
    ["fond-eleve", j["fond-eleve"]],
    ["surface", j.surface],
  ] as const;

  it.each(fonds)("le texte courant tient sur %s", (_ou, arriere) => {
    expect(contraste(j.texte, arriere)).toBeGreaterThanOrEqual(SEUIL);
  });

  it.each(fonds)("le texte atténué tient sur %s", (_ou, arriere) => {
    expect(contraste(j["texte-attenue"], arriere)).toBeGreaterThanOrEqual(SEUIL);
  });

  /*
   * C'est celui qui échouait, et sur les trois fonds à la fois. Il porte
   * l'utilitaire « annotation », donc la moitié des petits textes du site :
   * légendes, métadonnées, entrées de navigation secondaire.
   */
  it.each(fonds)("le texte faible tient sur %s", (_ou, arriere) => {
    expect(contraste(j["texte-faible"], arriere)).toBeGreaterThanOrEqual(SEUIL);
  });

  const aplats = [
    ["bleu", j.bleu, j["sur-bleu"]],
    ["corail", j.corail, j["sur-corail"]],
    ["citron", j.citron, j["sur-citron"]],
  ] as const;

  it.each(aplats)("l'encre de l'aplat %s tient", (_nom, fond, encre) => {
    expect(contraste(encre, fond)).toBeGreaterThanOrEqual(SEUIL);
  });

});
