/**
 * Garde-fou d'anonymisation.
 *
 * Les travaux menés en alternance sont présentés sans nommer l'organisme, ses
 * instituts, ses sites, ses modèles ni ses territoires. Une décision pareille
 * ne tient pas sur la mémoire : il suffit d'un copier-coller depuis un README
 * d'origine pour la percer. Ce script relit tout ce qui part en ligne et
 * échoue si un terme interdit réapparaît.
 *
 * Lancé par `npm run verifier:anonymat`, et à brancher en intégration continue
 * avant tout déploiement.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Termes proscrits, en expressions régulières insensibles à la casse.
 *
 * Les bornes de mot évitent les faux positifs : « cvi » ne doit pas déclencher
 * sur « service », ni « cea » sur « océan ».
 */
const INTERDITS: { motif: RegExp; quoi: string }[] = [
  { motif: /\bC\.?E\.?A\b/i, quoi: "nom de l'organisme" },
  { motif: /\bisec\b/i, quoi: "nom de l'institut" },
  { motif: /\bcvi\b/i, quoi: "nom de l'équipe" },
  { motif: /\bmarcoule\b/i, quoi: "site géographique" },
  { motif: /\bbagnols\b/i, quoi: "site géographique" },
  { motif: /\boccitanie\b/i, quoi: "territoire modélisé" },
  { motif: /\bholistica\b/i, quoi: "nom de modèle" },
  { motif: /num['’]?\s?icare/i, quoi: "nom de modèle" },
  { motif: /\bocc\s?mobi\b/i, quoi: "nom de modèle" },
  { motif: /\bzaka\b/i, quoi: "nom de scénario" },
  { motif: /\bepr2?\b/i, quoi: "détail identifiant (réacteurs)" },
  { motif: /\bfeet[-\s]?forum\b/i, quoi: "évènement de l'organisme" },
];

/** Ce qui part en ligne, et rien d'autre. */
const CIBLES = ["src", "public", "content"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx", ".css", ".html", ".txt"]);

/** Ce fichier contient les motifs eux-mêmes : l'exclure évite l'autodétection. */
const EXCLUS = new Set([join("scripts", "verifier-anonymat.ts")]);

async function* fichiers(dossier: string): AsyncGenerator<string> {
  let entrees;
  try {
    entrees = await readdir(dossier, { withFileTypes: true });
  } catch {
    return; // Le dossier n'existe pas encore — ce n'est pas une erreur.
  }
  for (const e of entrees) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      yield* fichiers(chemin);
    } else if (EXTENSIONS.has(extname(e.name))) {
      yield chemin;
    }
  }
}

const infractions: string[] = [];

for (const cible of CIBLES) {
  for await (const chemin of fichiers(join(racine, cible))) {
    const relatif = relative(racine, chemin);
    if (EXCLUS.has(relatif)) continue;

    const contenu = await readFile(chemin, "utf8");
    const lignes = contenu.split(/\r?\n/);

    for (const { motif, quoi } of INTERDITS) {
      lignes.forEach((ligne, i) => {
        if (motif.test(ligne)) {
          infractions.push(`${relatif}:${i + 1}  ${quoi} — « ${ligne.trim().slice(0, 90)} »`);
        }
      });
    }
  }
}

if (infractions.length > 0) {
  console.error(`\n✗ Anonymisation percée — ${infractions.length} occurrence(s) :\n`);
  for (const i of infractions) console.error(`  ${i}`);
  console.error("\nCorriger avant tout déploiement.\n");
  process.exit(1);
}

console.log(`✓ Anonymisation intacte — ${INTERDITS.length} motifs vérifiés sur ${CIBLES.join(", ")}`);
