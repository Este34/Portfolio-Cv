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
import type { Langue } from "./langue";

let promesse: Promise<AsyncDuckDBConnection> | null = null;

/**
 * Ouvre (ou réutilise) une connexion DuckDB avec les tables du portfolio.
 *
 * Idempotent : les appels concurrents partagent la même promesse, pour ne pas
 * instancier deux moteurs si le visiteur ouvre et referme la console vite.
 */
export function connexionDuckDB(
  langue: Langue,
  surEtape?: (etape: EtapeChargement) => void,
): Promise<AsyncDuckDBConnection> {
  promesse ??= amorcer(langue, surEtape).catch((erreur) => {
    // Ne pas mettre en cache un échec : un réseau qui revient doit pouvoir
    // réussir au deuxième essai.
    promesse = null;
    throw erreur;
  });
  return promesse;
}

/**
 * Poignée sur le moteur lui-même, conservée à part de la connexion.
 *
 * Le bac à sable en a besoin pour enregistrer les fichiers déposés par le
 * visiteur : `registerFileBuffer` vit sur la base, pas sur la connexion. Un
 * second moteur pour ça coûterait 35 Mo de plus, pour rien.
 */
let base: AsyncDuckDB | null = null;

async function amorcer(
  langue: Langue,
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

  base = db;

  const connexion = await db.connect();
  await chargerTables(db, connexion, langue);

  surEtape?.("pret");
  return connexion;
}

/**
 * Enregistre `portfolio-{langue}.json` puis en dérive une table par clé.
 *
 * `read_json_auto` infère les types ; à cette échelle l'inférence est fiable et
 * évite d'entretenir un schéma en double.
 *
 * Les noms de tables et de colonnes sont identiques dans les deux langues :
 * seul le contenu des cellules change. Voir la note dans le générateur.
 */
async function chargerTables(
  db: AsyncDuckDB,
  connexion: AsyncDuckDBConnection,
  langue: Langue,
) {
  const fichier = `portfolio-${langue}.json`;
  const reponse = await fetch(`/data/${fichier}`);
  if (!reponse.ok) throw new Error(`${fichier} indisponible (${reponse.status})`);

  const donnees = (await reponse.json()) as Record<string, unknown[]>;

  for (const [table, lignes] of Object.entries(donnees)) {
    const nom = `${table}.json`;
    await db.registerFileText(nom, JSON.stringify(lignes));
    await connexion.query(
      `CREATE OR REPLACE TABLE "${table}" AS SELECT * FROM read_json_auto('${nom}')`,
    );
  }
}

export async function executer(sql: string, langue: Langue): Promise<ResultatRequete> {
  const connexion = await connexionDuckDB(langue);
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

/* ---------------------------------------------------------------------------
   Bac à sable : fichiers déposés par le visiteur
   --------------------------------------------------------------------------- */

export type TableChargee = {
  nom: string;
  lignes: number;
  colonnes: { nom: string; type: string }[];
};

/** Extensions reconnues, et la fonction DuckDB qui sait les lire. */
const LECTEURS: Record<string, (chemin: string) => string> = {
  csv: (f) => `read_csv_auto('${f}', SAMPLE_SIZE=-1)`,
  tsv: (f) => `read_csv_auto('${f}', SAMPLE_SIZE=-1, delim='\\t')`,
  txt: (f) => `read_csv_auto('${f}', SAMPLE_SIZE=-1)`,
  json: (f) => `read_json_auto('${f}')`,
  ndjson: (f) => `read_json_auto('${f}')`,
  parquet: (f) => `read_parquet('${f}')`,
};

export const EXTENSIONS_ACCEPTEES = Object.keys(LECTEURS);

/**
 * Nettoie un nom de fichier pour en faire un identifiant SQL utilisable.
 *
 * Un visiteur dépose « Ventes 2024 (final).csv » ; il doit pouvoir écrire
 * `SELECT * FROM ventes_2024_final` sans se battre avec des guillemets.
 */
export function nomTable(fichier: string): string {
  const sansExtension = fichier.replace(/\.[^.]+$/, "");
  const propre = sansExtension
    .normalize("NFD")
    // Marques diacritiques combinantes, désignées par leur code plutôt qu'en
    // clair : écrites littéralement, elles sont invisibles dans un éditeur et
    // se perdent au premier copier-coller.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  // Un identifiant SQL ne peut pas commencer par un chiffre.
  return /^[0-9]/.test(propre) || propre === "" ? `t_${propre || "donnees"}` : propre;
}

/**
 * Enregistre un fichier local dans DuckDB et en crée une table.
 *
 * **Le fichier ne quitte pas la machine du visiteur.** Il est lu en mémoire par
 * le navigateur, remis au moteur WebAssembly qui tourne dans l'onglet, et rien
 * n'est envoyé nulle part — c'est la propriété qui rend cet outil utilisable sur
 * des données qu'on n'a pas le droit de téléverser ailleurs.
 */
export async function chargerFichier(fichier: File, langue: Langue): Promise<TableChargee> {
  const connexion = await connexionDuckDB(langue);
  if (!base) throw new Error("Moteur non initialisé");

  const extension = fichier.name.split(".").pop()?.toLowerCase() ?? "";
  const lecteur = LECTEURS[extension];
  if (!lecteur) {
    throw new Error(
      `Format « ${extension || "inconnu"} » non pris en charge. Formats acceptés : ${EXTENSIONS_ACCEPTEES.join(", ")}.`,
    );
  }

  const table = nomTable(fichier.name);
  const chemin = `${table}.${extension}`;

  await base.registerFileBuffer(chemin, new Uint8Array(await fichier.arrayBuffer()));
  await connexion.query(`CREATE OR REPLACE TABLE "${table}" AS SELECT * FROM ${lecteur(chemin)}`);

  const schema = await connexion.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = '${table}' ORDER BY ordinal_position`,
  );
  const compte = await connexion.query(`SELECT count(*) AS n FROM "${table}"`);

  return {
    nom: table,
    lignes: Number((compte.toArray()[0] as { n: bigint | number }).n),
    colonnes: schema.toArray().map((l) => {
      const o = l.toJSON() as { column_name: string; data_type: string };
      return { nom: o.column_name, type: o.data_type };
    }),
  };
}
