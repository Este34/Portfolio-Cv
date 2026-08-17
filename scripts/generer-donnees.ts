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
import { LANGUES, t, type Langue } from "../src/lib/langue.ts";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const dossier = join(racine, "public", "data");

/**
 * Tables mises à plat, dans une langue.
 *
 * DuckDB gère les structures imbriquées, mais des tables plates reliées par
 * `slug` donnent des requêtes qu'un visiteur peut écrire de tête — ce qui est
 * tout l'intérêt d'exposer une console.
 *
 * **Les noms de tables et de colonnes restent en français dans les deux
 * fichiers.** Les traduire supposerait deux schémas pour des données
 * identiques, donc deux jeux de requêtes d'exemple et deux façons de se
 * tromper. Seul le contenu des cellules change de langue.
 */
function tables(langue: Langue) {
  return {
    travaux: TRAVAUX.map((tr) => ({
      slug: tr.slug,
      titre: t(tr.titre, langue),
      sous_titre: t(tr.sousTitre, langue),
      resume: t(tr.resume, langue),
      annee: Number(tr.annee),
      role: t(tr.role, langue),
      diffusion: tr.confidentialite,
      rang: tr.rang,
      nb_technos: tr.stack.length,
      nb_decisions: tr.decisions.length,
    })),

    stack: TRAVAUX.flatMap((tr) =>
      tr.stack.map((techno) => ({ slug: tr.slug, techno, annee: Number(tr.annee) })),
    ),

    domaines: TRAVAUX.flatMap((tr) =>
      tr.domaines.map((domaine) => ({ slug: tr.slug, domaine: t(domaine, langue) })),
    ),

    chiffres: TRAVAUX.flatMap((tr) =>
      tr.chiffres.map((c) => ({
        slug: tr.slug,
        valeur: t(c.valeur, langue),
        libelle: t(c.libelle, langue),
        note: c.note ? t(c.note, langue) : null,
      })),
    ),

    decisions: TRAVAUX.flatMap((tr) =>
      tr.decisions.map((d, i) => ({
        slug: tr.slug,
        rang: i + 1,
        choix: t(d.choix, langue),
        raison: t(d.raison, langue),
      })),
    ),

    competences: COMPETENCES.flatMap((g) =>
      g.items.map((competence) => ({
        famille: t(g.famille, langue),
        competence: t(competence, langue),
      })),
    ),

    parcours: [...EXPERIENCES, ...FORMATION].map((e) => ({
      periode: t(e.periode, langue),
      titre: t(e.titre, langue),
      lieu: t(e.lieu, langue),
      description: t(e.description, langue),
    })),
  };
}

await mkdir(dossier, { recursive: true });

for (const langue of LANGUES) {
  const donnees = tables(langue);
  await writeFile(join(dossier, `portfolio-${langue}.json`), JSON.stringify(donnees), "utf8");

  const lignes = Object.entries(donnees)
    .map(([table, rows]) => `  ${table.padEnd(12)} ${String(rows.length).padStart(3)} lignes`)
    .join("\n");

  console.log(
    `portfolio-${langue}.json écrit — ${Object.keys(donnees).length} tables\n${lignes}`,
  );
}
