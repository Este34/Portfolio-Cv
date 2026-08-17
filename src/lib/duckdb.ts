/**
 * Chargement paresseux de DuckDB-WASM.
 *
 * ## Pourquoi ce module existe
 *
 * DuckDB-WASM pèse entre 34 et 40 Mo selon la variante — environ 10 Mo une fois
 * compressé. C'est le prix d'un vrai moteur analytique, et il est hors de
 * question de le faire payer à quelqu'un qui vient lire trois paragraphes.
 * Rien n'est donc chargé avant que le visiteur n'ouvre explicitement la console.
 *
 * ## Pourquoi le CDN et pas un fichier local
 *
 * Servir les binaires depuis `public/` demanderait de verser 75 Mo dans le
 * dépôt (deux variantes nécessaires pour couvrir les navigateurs). Le CDN
 * officiel du projet évite ça. C'est la seule dépendance externe du site, elle
 * ne concerne que la console, et son échec est rattrapé proprement.
 */

import type { AsyncDuckDB, AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";

import type { EtapeChargement, ResultatRequete } from "./duckdb-types";

let promesse: Promise<AsyncDuckDBConnection> | null = null;

/**
 * Ouvre (ou réutilise) une connexion DuckDB avec les tables du portfolio.
 *
 * Idempotent : les appels concurrents partagent la même promesse, pour ne pas
 * instancier deux moteurs si le visiteur ouvre et referme la console vite.
 */
export function connexionDuckDB(
  surEtape?: (etape: EtapeChargement) => void,
): Promise<AsyncDuckDBConnection> {
  promesse ??= amorcer(surEtape).catch((erreur) => {
    // Ne pas mettre en cache un échec : un réseau qui revient doit pouvoir
    // réussir au deuxième essai.
    promesse = null;
    throw erreur;
  });
  return promesse;
}

async function amorcer(
  surEtape?: (etape: EtapeChargement) => void,
): Promise<AsyncDuckDBConnection> {
  surEtape?.("telechargement");

  const duckdb = await import("@duckdb/duckdb-wasm");
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());

  // Le worker doit venir de la même origine : on l'enveloppe dans un blob qui
  // importe le script distant.
  const urlWorker = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: "text/javascript" }),
  );

  surEtape?.("instanciation");

  const worker = new Worker(urlWorker);
  const db: AsyncDuckDB = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(urlWorker);

  surEtape?.("donnees");

  const connexion = await db.connect();
  await chargerTables(db, connexion);

  surEtape?.("pret");
  return connexion;
}

/**
 * Enregistre `portfolio.json` puis en dérive une table par clé.
 *
 * `read_json_auto` infère les types ; à cette échelle l'inférence est fiable et
 * évite d'entretenir un schéma en double.
 */
async function chargerTables(db: AsyncDuckDB, connexion: AsyncDuckDBConnection) {
  const reponse = await fetch("/data/portfolio.json");
  if (!reponse.ok) throw new Error(`portfolio.json indisponible (${reponse.status})`);

  const donnees = (await reponse.json()) as Record<string, unknown[]>;

  for (const [table, lignes] of Object.entries(donnees)) {
    const nom = `${table}.json`;
    await db.registerFileText(nom, JSON.stringify(lignes));
    await connexion.query(
      `CREATE OR REPLACE TABLE "${table}" AS SELECT * FROM read_json_auto('${nom}')`,
    );
  }
}

export async function executer(sql: string): Promise<ResultatRequete> {
  const connexion = await connexionDuckDB();
  const debut = performance.now();
  const table = await connexion.query(sql);
  const duree = performance.now() - debut;

  const colonnes = table.schema.fields.map((f) => f.name);
  const lignes = table.toArray().map((ligne) => {
    const objet = ligne.toJSON() as Record<string, unknown>;
    return colonnes.map((c) => objet[c]);
  });

  return { colonnes, lignes, duree };
}
