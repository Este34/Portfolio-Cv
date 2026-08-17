/**
 * Génère `public/data/portfolio.json` depuis le contenu TypeScript.
 *
 * Le fichier est consommé par la console SQL : DuckDB-WASM en crée des tables à
 * l'ouverture, et le visiteur les interroge pour de vrai.
 *
 * **Pourquoi du JSON et pas du Parquet ?** Parce que le corpus tient en
 * quelques dizaines de lignes. Un format colonnaire compressé ne rend aucun
 * service à cette échelle : il ajoute une dépendance d'écriture, une étape de
 * build et un binaire opaque, pour économiser quelques kilo-octets sur un
 * fichier qui n'est chargé que si l'on ouvre la console. Parquet a sa place
 * dans le pipeline Comtrade, où il y a des millions de lignes — pas ici.
 *
 * Lancé par `npm run generer:donnees`, et automatiquement avant chaque build.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { TRAVAUX } from "../src/content/travaux.ts";
import { COMPETENCES, EXPERIENCES, FORMATION } from "../src/content/parcours.ts";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const sortie = join(racine, "public", "data", "portfolio.json");

/**
 * Tables mises à plat.
 *
 * DuckDB gère les structures imbriquées, mais des tables plates reliées par
 * `slug` donnent des requêtes qu'un visiteur peut écrire de tête — ce qui est
 * tout l'intérêt d'exposer une console.
 */
const donnees = {
  travaux: TRAVAUX.map((t) => ({
    slug: t.slug,
    titre: t.titre,
    sous_titre: t.sousTitre,
    resume: t.resume,
    annee: Number(t.annee),
    role: t.role,
    diffusion: t.confidentialite,
    rang: t.rang,
    nb_technos: t.stack.length,
    nb_decisions: t.decisions.length,
  })),

  stack: TRAVAUX.flatMap((t) =>
    t.stack.map((techno) => ({ slug: t.slug, techno, annee: Number(t.annee) })),
  ),

  domaines: TRAVAUX.flatMap((t) => t.domaines.map((domaine) => ({ slug: t.slug, domaine }))),

  chiffres: TRAVAUX.flatMap((t) =>
    t.chiffres.map((c) => ({ slug: t.slug, valeur: c.valeur, libelle: c.libelle, note: c.note ?? null })),
  ),

  decisions: TRAVAUX.flatMap((t) =>
    t.decisions.map((d, i) => ({ slug: t.slug, rang: i + 1, choix: d.choix, raison: d.raison })),
  ),

  competences: COMPETENCES.flatMap((g) =>
    g.items.map((competence) => ({ famille: g.famille, competence })),
  ),

  parcours: [...EXPERIENCES, ...FORMATION]
    .filter((e) => !e.aCompleter)
    .map((e) => ({ periode: e.periode, titre: e.titre, lieu: e.lieu, description: e.description })),
};

await mkdir(dirname(sortie), { recursive: true });
await writeFile(sortie, JSON.stringify(donnees), "utf8");

const lignes = Object.entries(donnees)
  .map(([table, rows]) => `  ${table.padEnd(12)} ${String(rows.length).padStart(3)} lignes`)
  .join("\n");

console.log(`portfolio.json écrit — ${Object.keys(donnees).length} tables\n${lignes}`);
