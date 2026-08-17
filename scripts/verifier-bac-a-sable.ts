/**
 * Vérifie le bac à sable de bout en bout, dans un vrai navigateur.
 *
 * Dépose un fichier, contrôle que le schéma est inféré, exécute une requête
 * d'agrégation et compare le résultat aux valeurs attendues. C'est la seule
 * façon de savoir si la chaîne complète — lecture du fichier en mémoire,
 * enregistrement dans le moteur WebAssembly, inférence de types, requête —
 * fonctionne réellement : aucun test unitaire ne couvre ce parcours.
 *
 * Usage : node scripts/verifier-bac-a-sable.ts [base]
 */

import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3000";

const CSV = `region,mois,produit,quantite,ca_euros
Occitanie,2024-01,Graphite,1250,48200.50
Occitanie,2024-02,Graphite,1380,53100.00
Bretagne,2024-01,Lithium,860,91200.75
Bretagne,2024-02,Lithium,910,96400.25
Normandie,2024-01,Cobalt,430,72300.00
Normandie,2024-02,Cobalt,505,84900.60
Occitanie,2024-03,Graphite,1420,54800.10
Bretagne,2024-03,Lithium,975,103200.00
Normandie,2024-03,Cobalt,560,94100.80
`;

const dossier = await mkdtemp(join(tmpdir(), "bac-"));
// Nom volontairement hostile : espaces, accent, parenthèses, majuscules.
const fichier = join(dossier, "Ventes Régionales (2024).csv");
await writeFile(fichier, CSV, "utf8");

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });

const erreurs: string[] = [];
page.on("pageerror", (e) => erreurs.push(e.message));

let echecs = 0;
function verifier(nom: string, condition: boolean, detail = "") {
  console.log(`${condition ? "✓" : "✗"} ${nom}${detail ? `  ${detail}` : ""}`);
  if (!condition) echecs++;
}

await page.goto(`${BASE}/bac-a-sable`, { waitUntil: "networkidle" });

// Le moteur ne doit pas être chargé avant le dépôt.
const avant = await page.evaluate(() =>
  performance.getEntriesByType("resource").some((r) => r.name.includes("duckdb")),
);
verifier("le moteur n'est pas chargé à l'ouverture", !avant);

await page.locator('input[type="file"]').setInputFiles(fichier);

// Le premier dépôt télécharge le moteur : laisser le temps.
await page.getByText("table chargée", { exact: false }).waitFor({ timeout: 120_000 });

const nomTable = (await page.locator("code").first().textContent())?.trim();
verifier(
  "le nom de fichier hostile devient un identifiant SQL",
  nomTable === "ventes_regionales_2024",
  `→ ${nomTable}`,
);

const lignes = await page.getByText("lignes", { exact: false }).first().textContent();
verifier("les 9 lignes sont comptées", /\b9\b/.test(lignes ?? ""), `→ ${lignes?.trim()}`);

const colonnes = await page.locator("li[title]").allTextContents();
verifier(
  "les cinq colonnes sont inférées avec leur type",
  colonnes.length === 5 && colonnes.some((c) => /ca_euros/.test(c)),
  `→ ${colonnes.length} colonnes`,
);
verifier(
  "les nombres décimaux ne sont pas pris pour du texte",
  colonnes.some((c) => /ca_euros/.test(c) && /(double|decimal|float)/i.test(c)),
  `→ ${colonnes.find((c) => /ca_euros/.test(c))?.trim()}`,
);

// Une agrégation, dont le résultat est calculable à la main.
await page.locator("#sql").fill(
  `SELECT produit, sum(quantite) AS q, round(sum(ca_euros), 2) AS ca
   FROM ventes_regionales_2024 GROUP BY produit ORDER BY ca DESC`,
);
await page.getByRole("button", { name: "Exécuter" }).click();
await page.locator("table tbody tr").first().waitFor({ timeout: 30_000 });

const resultat = await page.locator("table tbody tr").evaluateAll((lignesDom) =>
  lignesDom.map((l) => [...l.querySelectorAll("td")].map((c) => c.textContent?.trim() ?? "")),
);

verifier("l'agrégation rend trois groupes", resultat.length === 3, `→ ${resultat.length}`);
// Lithium : 860 + 910 + 975 = 2745 ; 91200.75 + 96400.25 + 103200 = 290801.00
verifier(
  "les sommes sont exactes",
  resultat[0]?.[0] === "Lithium" && resultat[0]?.[1] === "2745" && resultat[0]?.[2] === "290801",
  `→ ${resultat[0]?.join(" | ")}`,
);

verifier("aucune erreur de page", erreurs.length === 0, erreurs.join(" ; "));

await page.screenshot({ path: ".captures/10-bac-a-sable.png" });
await navigateur.close();

console.log(echecs === 0 ? "\nBac à sable conforme." : `\n${echecs} vérification(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
