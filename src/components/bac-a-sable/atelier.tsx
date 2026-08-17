"use client";

import { useCallback, useRef, useState } from "react";

import { LIBELLE_ETAPE, type EtapeChargement, type ResultatRequete } from "@/lib/duckdb-types";

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
export function Atelier() {
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
        chargees.push(await chargerFichier(f));
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
      setErreur(e instanceof Error ? e.message : "Chargement impossible");
    }
  }, []);

  async function lancer() {
    const requete = sql.trim();
    if (!requete) return;
    setEnCours(true);
    setErreur(null);
    try {
      const { executer } = await import("@/lib/duckdb");
      setResultat(await executer(requete));
    } catch (e: unknown) {
      setResultat(null);
      setErreur(e instanceof Error ? e.message : "Requête invalide");
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
        <p className="text-texte text-lg font-bold uppercase">Déposez un fichier ici</p>
        <p className="text-texte-attenue mx-auto mt-2 max-w-md text-sm leading-relaxed">
          {FORMATS.join(", ")}. Il est lu dans votre navigateur et interrogé sur place —{" "}
          <strong className="text-texte font-semibold">rien n&apos;est envoyé nulle part</strong>,
          il n&apos;y a aucun serveur au bout.
        </p>

        <button
          type="button"
          onClick={() => champFichier.current?.click()}
          className="bloc-corail mt-5 px-5 py-2.5 text-sm font-bold uppercase"
        >
          Choisir un fichier
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
            {LIBELLE_ETAPE[etape]} — une dizaine de méga-octets, une seule fois.
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
            {tables.length} table{tables.length > 1 ? "s" : ""} chargée
            {tables.length > 1 ? "s" : ""}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {tables.map((t) => (
              <div key={t.nom} className="border-trait border p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <code className="text-corail donnee font-bold">{t.nom}</code>
                  <span className="annotation tabulaire">
                    {t.lignes.toLocaleString("fr-FR")} lignes
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
            Votre requête
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
              {enCours ? "Exécution…" : "Exécuter"}
            </button>
            <span className="annotation">Ctrl + Entrée</span>
          </div>
        </section>
      )}

      {/* ---- Résultat ---------------------------------------------------- */}
      {resultat && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-texte text-lg uppercase">
              {resultat.lignes.length} ligne{resultat.lignes.length > 1 ? "s" : ""}
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
              500 premières lignes affichées sur {resultat.lignes.length.toLocaleString("fr-FR")} —
              la requête, elle, a porté sur tout.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
