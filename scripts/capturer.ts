/**
 * Capture le site en images, pour pouvoir juger le rendu.
 *
 * Playwright rend hors écran mais compose réellement les images, contrairement
 * à un panneau d'aperçu masqué : les canvas s'animent, les filtres CSS
 * s'appliquent, et les captures reflètent ce qu'un visiteur voit.
 *
 * Usage :
 *   node scripts/capturer.ts                        # le site déployé
 *   node scripts/capturer.ts http://localhost:3000  # une version locale
 */

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Page } from "@playwright/test";

const BASE = process.argv[2] ?? "https://portfolio-cv-weld.vercel.app";
const SORTIE = join(dirname(fileURLToPath(import.meta.url)), "..", ".captures");

type Vue = {
  nom: string;
  chemin: string;
  largeur: number;
  hauteur: number;
  theme: "dark" | "light";
  /** Faire défiler jusqu'à ce sélecteur et laisser le temps de s'animer. */
  attendre?: string;
  pleinePage?: boolean;
};

const VUES: Vue[] = [
  { nom: "01-accueil-sombre", chemin: "/fr", largeur: 1440, hauteur: 900, theme: "dark" },
  { nom: "02-accueil-clair", chemin: "/fr", largeur: 1440, hauteur: 900, theme: "light" },
  { nom: "03-accueil-mobile", chemin: "/fr", largeur: 390, hauteur: 844, theme: "dark" },
  {
    nom: "04-accueil-corpus",
    chemin: "/fr",
    largeur: 1440,
    hauteur: 900,
    theme: "dark",
    attendre: "canvas",
  },
  { nom: "05-travaux", chemin: "/fr/travaux", largeur: 1440, hauteur: 900, theme: "dark" },
  {
    nom: "06-etude-de-cas",
    chemin: "/fr/travaux/pipeline-comtrade",
    largeur: 1440,
    hauteur: 900,
    theme: "dark",
  },
  { nom: "07-labo", chemin: "/fr/labo", largeur: 1440, hauteur: 1000, theme: "dark", attendre: "canvas" },
  { nom: "08-making-of", chemin: "/fr/making-of", largeur: 1440, hauteur: 900, theme: "dark" },
  { nom: "09-parcours", chemin: "/fr/parcours", largeur: 1440, hauteur: 900, theme: "dark" },
  { nom: "10-accueil-anglais", chemin: "/en", largeur: 1440, hauteur: 900, theme: "dark" },
  { nom: "11-travaux-anglais", chemin: "/en/travaux", largeur: 1440, hauteur: 900, theme: "dark" },
];

await mkdir(SORTIE, { recursive: true });

const navigateur = await chromium.launch();

async function capturer(vue: Vue) {
  const contexte = await navigateur.newContext({
    viewport: { width: vue.largeur, height: vue.hauteur },
    colorScheme: vue.theme,
    deviceScaleFactor: 1,
    // Le site n'anime rien d'essentiel ; on garde le mouvement pour juger les
    // simulations, mais on coupe les transitions qui brouilleraient l'image.
    reducedMotion: "no-preference",
  });

  const page: Page = await contexte.newPage();
  const erreurs: string[] = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") erreurs.push(m.text().slice(0, 160));
  });

  await page.goto(`${BASE}${vue.chemin}`, { waitUntil: "networkidle", timeout: 60_000 });

  if (vue.attendre) {
    await page.locator(vue.attendre).first().scrollIntoViewIfNeeded();
    // Laisser les boucles d'animation produire quelques dizaines d'images.
    await page.waitForTimeout(2500);
  }

  await page.screenshot({
    path: join(SORTIE, `${vue.nom}.png`),
    fullPage: vue.pleinePage ?? false,
  });

  await contexte.close();

  const etat = erreurs.length ? `⚠ ${erreurs.length} erreur(s)` : "ok";
  console.log(`${vue.nom.padEnd(22)} ${vue.largeur}×${vue.hauteur} ${vue.theme.padEnd(5)} ${etat}`);
  for (const e of erreurs.slice(0, 3)) console.log(`    ${e}`);
}

console.log(`Cible : ${BASE}\n`);
for (const vue of VUES) await capturer(vue);
await navigateur.close();
console.log(`\nCaptures dans ${SORTIE}`);
