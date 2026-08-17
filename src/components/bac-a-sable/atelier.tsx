"use client";

import { useCallback, useRef, useState } from "react";

import { LIBELLE_ETAPE, type EtapeChargement, type ResultatRequete } from "@/lib/duckdb-types";
import type { Langue } from "@/lib/langue";

type TableChargee = {
  nom: string;
  lignes: number;
  colonnes: { nom: string; type: string }[];
};

const FORMATS = ["csv", "tsv", "json", "ndjson", "parquet", "txt"];

/**
 * Bac à sable analytique.
 *
 * Le visiteur dépose ses propres fichiers, ils deviennent des tables DuckDB, et
 * il les interroge en SQL. **Rien ne quitte sa machine** : le fichier est lu en
 * mémoire par le navigateur et remis au moteur WebAssembly qui tourne dans
 * l'onglet. C'est cette propriété qui rend l'outil utilisable sur des données
 * qu'on n'a pas le droit de téléverser ailleurs — et c'est aussi la
 * démonstration la plus directe de ce que je sais faire.
 *
 * Le moteur n'est chargé qu'au premier dépôt, jamais à l'ouverture de la page.
 */

const MOTS = {
  fr: {
    deposez: "Déposez un fichier ici",
    lu: ". Il est lu dans votre navigateur et interrogé sur place, ",
    rienEnvoye: "rien n'est envoyé nulle part",
    aucunServeur: ", il n'y a aucun serveur au bout.",
    choisir: "Choisir un fichier",
    amorcage: ", une dizaine de méga-octets, une seule fois.",
    requeteInvalide: "Requête invalide",
    chargementImpossible: "Chargement impossible",
    votreRequete: "Votre requête",
    executer: "Exécuter",
    execution: "Exécution…",
    raccourci: "Ctrl + Entrée",
    tables: (n: number) => `${n} table${n > 1 ? "s" : ""} chargée${n > 1 ? "s" : ""}`,
    lignes: (n: number) => `${n.toLocaleString("fr-FR")} ligne${n > 1 ? "s" : ""}`,
    tronque: (total: number) =>
      `500 premières lignes affichées sur ${total.toLocaleString("fr-FR")}. La requête, elle, a porté sur tout.`,
  },
  en: {
    deposez: "Drop a file here",
    lu: ". It is read inside your browser and queried on the spot, ",
    rienEnvoye: "nothing is sent anywhere",
    aucunServeur: "; there is no server at the other end.",
    choisir: "Choose a file",
    amorcage: ", about ten megabytes, once.",
    requeteInvalide: "Invalid query",
    chargementImpossible: "Could not load the file",
    votreRequete: "Your query",
    executer: "Run",
    execution: "Running…",
    raccourci: "Ctrl + Enter",
    tables: (n: number) => `${n} table${n > 1 ? "s" : ""} loaded`,
    lignes: (n: number) => `${n.toLocaleString("en-US")} row${n > 1 ? "s" : ""}`,
    tronque: (total: number) =>
      `Showing the first 500 rows out of ${total.toLocaleString("en-US")}. The query itself covered all of them.`,
  },
} as const;

export function Atelier({ langue }: { langue: Langue }) {
  const mots = MOTS[langue];
  const champFichier = useRef<HTMLInputElement>(null);

  const [etape, setEtape] = useState<EtapeChargement>("inactif");
  const [tables, setTables] = useState<TableChargee[]>([]);
  const [sql, setSql] = useState("");
  const [resultat, setResultat] = useState<ResultatRequete | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [survol, setSurvol] = useState(false);

  const traiter = useCallback(async (fichiers: FileList | File[]) => {
    const liste = [...fichiers];
    if (liste.length === 0) return;

    setErreur(null);
    setEtape((e) => (e === "pret" ? e : "telechargement"));

    try {
      const { chargerFichier } = await import("@/lib/duckdb");
      const chargees: TableChargee[] = [];

      for (const f of liste) {
        // Séquentiel et non parallèle : deux `CREATE TABLE` concurrents sur la
        // même connexion se marchent dessus, et l'ordre d'affichage doit suivre
        // l'ordre de dépôt.
        chargees.push(await chargerFichier(f, langue));
      }

      setEtape("pret");
      setTables((precedentes) => {
        const parNom = new Map(precedentes.map((t) => [t.nom, t]));
        for (const t of chargees) parNom.set(t.nom, t);
        return [...parNom.values()];
      });

      // Première table déposée : on propose d'emblée une requête qui marche.
      if (chargees[0]) setSql(`SELECT * FROM ${chargees[0].nom} LIMIT 20`);
    } catch (e: unknown) {
      setEtape("echec");
      setErreur(e instanceof Error ? e.message : mots.chargementImpossible);
    }
  }, [langue, mots]);

  async function lancer() {
    const requete = sql.trim();
    if (!requete) return;
    setEnCours(true);
    setErreur(null);
    try {
      const { executer } = await import("@/lib/duckdb");
      setResultat(await executer(requete, langue));
    } catch (e: unknown) {
      setResultat(null);
      setErreur(e instanceof Error ? e.message : mots.requeteInvalide);
    } finally {
      setEnCours(false);
    }
  }

  const amorcage = etape !== "inactif" && etape !== "pret" && etape !== "echec";

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Dépôt ------------------------------------------------------- */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          void traiter(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed p-8 text-center transition-colors ${
          survol ? "border-corail bg-signal-voile" : "border-trait"
        }`}
      >
        <p className="text-texte text-lg font-bold uppercase">{mots.deposez}</p>
        <p className="text-texte-attenue mx-auto mt-2 max-w-md text-sm leading-relaxed">
          {FORMATS.join(", ")}
          {mots.lu}
          <strong className="text-texte font-semibold">{mots.rienEnvoye}</strong>
          {mots.aucunServeur}
        </p>

        <button
          type="button"
          onClick={() => champFichier.current?.click()}
          className="bloc-corail mt-5 px-5 py-2.5 text-sm font-bold uppercase"
        >
          {mots.choisir}
        </button>
        <input
          ref={champFichier}
          type="file"
          multiple
          accept={FORMATS.map((f) => `.${f}`).join(",")}
          onChange={(e) => {
            if (e.target.files) void traiter(e.target.files);
            e.target.value = "";
          }}
          className="sr-only"
        />

        {amorcage && (
          <p className="text-corail mt-4 animate-pulse text-sm font-semibold">
            {LIBELLE_ETAPE[langue][etape]}
            {mots.amorcage}
          </p>
        )}
      </div>

      {erreur && (
        <p className="border-corail bg-signal-voile text-corail border-2 px-4 py-3 font-mono text-sm">
          {erreur}
        </p>
      )}

      {/* ---- Schéma des tables chargées ---------------------------------- */}
      {tables.length > 0 && (
        <section>
          <h2 className="text-texte text-lg uppercase">
            {mots.tables(tables.length)}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {tables.map((t) => (
              <div key={t.nom} className="border-trait border p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <code className="text-corail donnee font-bold">{t.nom}</code>
                  <span className="annotation tabulaire">
                    {mots.lignes(t.lignes)}
                  </span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-1">
                  {t.colonnes.map((c) => (
                    <li
                      key={c.nom}
                      className="border-trait text-texte-attenue border px-1.5 py-0.5 text-xs"
                      title={c.type}
                    >
                      {c.nom}
                      <span className="text-texte-faible ml-1">{c.type.toLowerCase()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Requête ----------------------------------------------------- */}
      {tables.length > 0 && (
        <section>
          <label htmlFor="sql" className="text-texte text-lg uppercase">
            {mots.votreRequete}
          </label>
          <textarea
            id="sql"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl+Entrée exécute : la convention de tous les clients SQL.
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                void lancer();
              }
            }}
            rows={5}
            spellCheck={false}
            className="border-trait-fort bg-fond-eleve text-texte mt-3 block w-full resize-y border-2 p-3 font-mono text-sm outline-none focus-visible:border-corail"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => void lancer()}
              disabled={enCours}
              className="bloc-corail px-5 py-2.5 text-sm font-bold uppercase disabled:opacity-40"
            >
              {enCours ? mots.execution : mots.executer}
            </button>
            <span className="annotation">{mots.raccourci}</span>
          </div>
        </section>
      )}

      {/* ---- Résultat ---------------------------------------------------- */}
      {resultat && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-texte text-lg uppercase">
              {mots.lignes(resultat.lignes.length)}
            </h2>
            <span className="annotation tabulaire">{resultat.duree.toFixed(1)} ms</span>
          </div>
          <div className="border-trait-fort max-h-[28rem] overflow-auto border-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface sticky top-0">
                <tr>
                  {resultat.colonnes.map((c) => (
                    <th key={c} className="border-trait border-b px-3 py-2 font-bold whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-trait divide-y">
                {resultat.lignes.slice(0, 500).map((ligne, i) => (
                  <tr key={i}>
                    {ligne.map((cell, j) => (
                      <td key={j} className="text-texte-attenue px-3 py-1.5 align-top font-mono">
                        {cell === null ? <span className="text-texte-faible">∅</span> : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resultat.lignes.length > 500 && (
            <p className="annotation mt-2">
              {mots.tronque(resultat.lignes.length)}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
