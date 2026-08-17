"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { TRAVAUX_TRIES } from "@/content/travaux";
import { NAV_DISCRETE, NAV_ITEMS } from "@/lib/site";
/*
 * Types et libellés seulement. `lib/duckdb.ts` et `lib/rag.ts` ne sont JAMAIS
 * importés statiquement ici : il suffirait d'un import de type mal placé pour
 * tirer un moteur de plusieurs dizaines de méga-octets dans le lot initial et
 * le faire payer à quelqu'un qui n'ouvrira jamais la console.
 */
import {
  LIBELLE_ETAPE,
  REQUETES_TYPES,
  type EtapeChargement,
  type ResultatRequete,
} from "@/lib/duckdb-types";
import {
  LIBELLE_ETAPE_RAG,
  QUESTIONS_TYPES,
  type EtapeRag,
  type Reponse,
} from "@/lib/rag-types";

type Mode = "navigation" | "sql" | "demander";

const CIBLES = [
  ...NAV_ITEMS.map((n) => ({ href: n.href, label: n.label, detail: n.description })),
  ...NAV_DISCRETE.map((n) => ({ href: n.href, label: n.label, detail: "" })),
  ...TRAVAUX_TRIES.map((t) => ({ href: `/travaux/${t.slug}`, label: t.titre, detail: t.sousTitre })),
];

const PLACEHOLDER: Record<Mode, string> = {
  navigation: "Chercher une page…   « > » pour du SQL, « ? » pour une question",
  sql: "SELECT titre, annee FROM travaux ORDER BY rang",
  demander: "A-t-il déjà travaillé sur de l'IA ?",
};

const ETIQUETTE: Record<Mode, string> = {
  navigation: "ALLER À",
  sql: "SQL",
  demander: "QUESTION",
};

export function Palette() {
  const router = useRouter();
  const dialogue = useRef<HTMLDialogElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<Mode>("navigation");
  const [saisie, setSaisie] = useState("");
  const [selection, setSelection] = useState(0);

  // --- État du moteur SQL --------------------------------------------------
  const [etapeSql, setEtapeSql] = useState<EtapeChargement>("inactif");
  const [resultat, setResultat] = useState<ResultatRequete | null>(null);
  const [erreurSql, setErreurSql] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const sqlLance = useRef(false);

  // --- État du moteur de recherche ----------------------------------------
  const [etapeRag, setEtapeRag] = useState<EtapeRag>("inactif");
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [erreurRag, setErreurRag] = useState<string | null>(null);
  const [cherche, setCherche] = useState(false);
  const [redigeEnCours, setRedigeEnCours] = useState(false);
  const ragLance = useRef(false);

  const fermer = useCallback(() => {
    dialogue.current?.close();
    setOuvert(false);
  }, []);

  const ouvrir = useCallback(() => {
    setMode("navigation");
    setSaisie("");
    setSelection(0);
    setOuvert(true);
    dialogue.current?.showModal();
    requestAnimationFrame(() => champ.current?.focus());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (ouvert) fermer();
        else ouvrir();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert, ouvrir, fermer]);

  /*
   * Les moteurs sont amorcés depuis les gestionnaires d'évènement, jamais
   * depuis un effet : charger des dizaines de méga-octets est la conséquence
   * directe d'un geste de l'utilisateur, et c'est là que ça se lit.
   */
  const passerEnSql = useCallback(() => {
    setMode("sql");
    setSaisie("");
    if (sqlLance.current) return;
    sqlLance.current = true;
    setEtapeSql("telechargement");
    void (async () => {
      try {
        const { connexionDuckDB } = await import("@/lib/duckdb");
        await connexionDuckDB(setEtapeSql);
      } catch (e: unknown) {
        sqlLance.current = false;
        setEtapeSql("echec");
        setErreurSql(e instanceof Error ? e.message : "Moteur indisponible");
      }
    })();
  }, []);

  const passerEnRag = useCallback(() => {
    setMode("demander");
    setSaisie("");
    if (ragLance.current) return;
    ragLance.current = true;
    setEtapeRag("modele");
    void (async () => {
      try {
        const { moteurRag } = await import("@/lib/rag");
        await moteurRag(setEtapeRag);
      } catch (e: unknown) {
        ragLance.current = false;
        setEtapeRag("echec");
        setErreurRag(e instanceof Error ? e.message : "Moteur indisponible");
      }
    })();
  }, []);

  function onChangeSaisie(valeur: string) {
    if (mode === "navigation") {
      if (valeur.startsWith(">")) return passerEnSql();
      if (valeur.startsWith("?")) return passerEnRag();
    }
    setSaisie(valeur);
    setSelection(0);
  }

  const resultatsNav = CIBLES.filter((c) =>
    `${c.label} ${c.detail}`.toLowerCase().includes(saisie.toLowerCase()),
  );

  async function lancerSql(sql: string) {
    const requete = sql.trim();
    if (!requete) return;
    setEnCours(true);
    setErreurSql(null);
    try {
      const { executer } = await import("@/lib/duckdb");
      setResultat(await executer(requete));
    } catch (e: unknown) {
      setResultat(null);
      setErreurSql(e instanceof Error ? e.message : "Requête invalide");
    } finally {
      setEnCours(false);
    }
  }

  async function lancerQuestion(question: string) {
    const q = question.trim();
    if (!q) return;
    setCherche(true);
    setErreurRag(null);
    setReponse(null);
    try {
      const { chercher } = await import("@/lib/rag");
      setReponse(await chercher(q));
    } catch (e: unknown) {
      setErreurRag(e instanceof Error ? e.message : "Recherche impossible");
    } finally {
      setCherche(false);
    }
  }

  async function demanderRedaction() {
    if (!reponse || reponse.extraits.length === 0) return;
    setRedigeEnCours(true);
    try {
      const { rediger } = await import("@/lib/rag");
      const texte = await rediger(saisie, reponse.extraits);
      // `null` = service absent ou en panne : on garde les extraits, qui
      // répondent déjà. Aucune erreur affichée, rien à corriger pour le
      // visiteur.
      if (texte) setReponse((r) => (r ? { ...r, redaction: texte } : r));
    } finally {
      setRedigeEnCours(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (mode === "navigation") {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelection((s) => Math.min(s + 1, resultatsNav.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelection((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        const cible = resultatsNav[selection];
        if (cible) {
          e.preventDefault();
          fermer();
          router.push(cible.href);
        }
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mode === "sql") void lancerSql(saisie);
      else void lancerQuestion(saisie);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={ouvrir}
        className="border-trait text-texte-faible hover:border-signal hover:text-signal rounded-instrument flex items-center gap-2 border px-2.5 py-1 transition-colors"
      >
        <span className="annotation">Console</span>
        <kbd className="annotation border-trait rounded-instrument hidden border px-1 py-px sm:block">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onClick={(e) => {
          if (e.target === dialogue.current) fermer();
        }}
        aria-label="Console"
        className="bg-fond-eleve border-trait-fort rounded-panneau m-0 w-full max-w-3xl border p-0 text-inherit backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:mx-auto sm:mt-[10vh]"
      >
        <div className="border-trait flex items-center gap-2 border-b px-3 py-2">
          {mode === "navigation" ? (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="annotation text-texte-faible">{ETIQUETTE.navigation}</span>
              <button
                type="button"
                onClick={() => {
                  passerEnSql();
                  champ.current?.focus();
                }}
                className="annotation text-texte-faible hover:text-signal transition-colors"
              >
                / SQL
              </button>
              <button
                type="button"
                onClick={() => {
                  passerEnRag();
                  champ.current?.focus();
                }}
                className="annotation text-texte-faible hover:text-signal transition-colors"
              >
                / QUESTION
              </button>
            </div>
          ) : (
            <span className="annotation text-signal shrink-0">{ETIQUETTE[mode]}</span>
          )}

          <input
            ref={champ}
            value={saisie}
            onChange={(e) => onChangeSaisie(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={PLACEHOLDER[mode]}
            aria-label={ETIQUETTE[mode]}
            className="text-texte placeholder:text-texte-faible min-w-0 flex-1 bg-transparent py-1.5 font-mono text-sm outline-none"
          />

          {mode !== "navigation" && (
            <button
              type="button"
              onClick={() => (mode === "sql" ? void lancerSql(saisie) : void lancerQuestion(saisie))}
              disabled={
                mode === "sql" ? enCours || etapeSql !== "pret" : cherche || etapeRag !== "pret"
              }
              className="bg-signal text-fond rounded-instrument shrink-0 px-3 py-1 text-xs font-medium disabled:opacity-40"
            >
              {enCours || cherche ? "…" : mode === "sql" ? "Exécuter" : "Demander"}
            </button>
          )}

          <kbd className="annotation border-trait rounded-instrument hidden shrink-0 border px-1.5 py-0.5 sm:block">
            Échap
          </kbd>
        </div>

        <div className="max-h-[62vh] overflow-auto">
          {mode === "navigation" && (
            <ul className="p-1.5">
              {resultatsNav.length === 0 && (
                <li className="text-texte-faible px-3 py-6 text-center text-sm">Aucun résultat</li>
              )}
              {resultatsNav.map((c, i) => (
                <li key={c.href}>
                  <button
                    type="button"
                    onMouseEnter={() => setSelection(i)}
                    onClick={() => {
                      fermer();
                      router.push(c.href);
                    }}
                    className={`rounded-instrument flex w-full items-baseline gap-3 px-3 py-2 text-left ${
                      i === selection ? "bg-signal-voile text-signal" : "text-texte-attenue"
                    }`}
                  >
                    <span className="text-sm font-medium">{c.label}</span>
                    {c.detail && <span className="text-texte-faible truncate text-xs">{c.detail}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mode === "sql" && (
            <PanneauSql
              etape={etapeSql}
              erreur={erreurSql}
              resultat={resultat}
              onChoisir={(sql) => {
                setSaisie(sql);
                void lancerSql(sql);
              }}
            />
          )}

          {mode === "demander" && (
            <PanneauRag
              etape={etapeRag}
              erreur={erreurRag}
              reponse={reponse}
              cherche={cherche}
              redigeEnCours={redigeEnCours}
              onDemanderRedaction={() => void demanderRedaction()}
              onChoisir={(q) => {
                setSaisie(q);
                void lancerQuestion(q);
              }}
              onNaviguer={(href) => {
                fermer();
                router.push(href);
              }}
            />
          )}
        </div>
      </dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Amorçage({ libelle, note }: { libelle: string; note: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="annotation text-signal animate-pulse">{libelle}</p>
      <p className="text-texte-faible mx-auto mt-3 max-w-sm text-xs leading-relaxed">{note}</p>
    </div>
  );
}

function PanneauSql({
  etape,
  erreur,
  resultat,
  onChoisir,
}: {
  etape: EtapeChargement;
  erreur: string | null;
  resultat: ResultatRequete | null;
  onChoisir: (sql: string) => void;
}) {
  if (etape !== "pret" && etape !== "echec") {
    return (
      <Amorçage
        libelle={LIBELLE_ETAPE[etape]}
        note="DuckDB s'installe dans l'onglet. Une dizaine de méga-octets, une seule fois — ensuite tout s'exécute sur votre machine, sans qu'aucune donnée ne circule."
      />
    );
  }

  return (
    <div className="p-3">
      {erreur && (
        <p className="border-signal bg-signal-voile text-signal rounded-instrument mb-3 border px-3 py-2 font-mono text-xs">
          {erreur}
        </p>
      )}

      {resultat && (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="annotation">
              {resultat.lignes.length} ligne{resultat.lignes.length > 1 ? "s" : ""}
            </span>
            <span className="annotation">{resultat.duree.toFixed(1)} ms</span>
          </div>
          <div className="border-trait rounded-instrument overflow-x-auto border">
            <table className="w-full text-left text-xs">
              <thead className="border-trait bg-surface border-b">
                <tr>
                  {resultat.colonnes.map((c) => (
                    <th key={c} className="annotation px-3 py-2 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-trait divide-y">
                {resultat.lignes.slice(0, 100).map((ligne, i) => (
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
        </>
      )}

      {!resultat && !erreur && (
        <p className="text-texte-faible mb-3 px-1 text-xs leading-relaxed">
          Sept tables décrivent ce portfolio :{" "}
          <span className="text-texte-attenue font-mono">
            travaux, stack, domaines, chiffres, decisions, competences, parcours
          </span>
          . Écrivez votre requête, ou partez d&apos;une de celles-ci.
        </p>
      )}

      <div className="mt-3">
        <p className="annotation mb-2">Exemples</p>
        <ul className="flex flex-wrap gap-1.5">
          {REQUETES_TYPES.map((r) => (
            <li key={r.libelle}>
              <button
                type="button"
                onClick={() => onChoisir(r.sql)}
                className="border-trait text-texte-attenue hover:border-signal hover:text-signal rounded-instrument border px-2.5 py-1 text-xs transition-colors"
              >
                {r.libelle}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PanneauRag({
  etape,
  erreur,
  reponse,
  cherche,
  redigeEnCours,
  onChoisir,
  onNaviguer,
  onDemanderRedaction,
}: {
  etape: EtapeRag;
  erreur: string | null;
  reponse: Reponse | null;
  cherche: boolean;
  redigeEnCours: boolean;
  onChoisir: (q: string) => void;
  onNaviguer: (href: string) => void;
  onDemanderRedaction: () => void;
}) {
  if (etape !== "pret" && etape !== "echec") {
    return (
      <Amorçage
        libelle={LIBELLE_ETAPE_RAG[etape]}
        note="Le modèle qui vectorise votre question se télécharge une fois, puis s'exécute dans l'onglet. Votre question ne quitte pas votre machine."
      />
    );
  }

  return (
    <div className="p-3">
      {erreur && (
        <p className="border-signal bg-signal-voile text-signal rounded-instrument mb-3 border px-3 py-2 font-mono text-xs">
          {erreur}
        </p>
      )}

      {cherche && <p className="annotation text-signal animate-pulse px-1 py-4">Recherche…</p>}

      {reponse && !cherche && (
        <>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <span className="annotation">
              {reponse.extraits.length} passage{reponse.extraits.length > 1 ? "s" : ""} pertinent
              {reponse.extraits.length > 1 ? "s" : ""}
            </span>
            <span className="annotation">{reponse.duree.toFixed(0)} ms</span>
          </div>

          {reponse.extraits.length === 0 && (
            <p className="text-texte-attenue px-1 py-4 text-sm leading-relaxed">
              Rien dans le corpus ne répond à cette question. Plutôt que de vous présenter le
              passage le moins hors sujet, je préfère le dire.
            </p>
          )}

          {reponse.redaction && (
            <div className="border-signal bg-signal-voile rounded-instrument mb-3 border p-3">
              <p className="annotation text-signal mb-1.5">Réponse rédigée</p>
              <p className="text-texte text-sm leading-relaxed">{reponse.redaction}</p>
            </div>
          )}

          <ul className="divide-trait divide-y">
            {reponse.extraits.map((e, i) => (
              <li key={i} className="py-3 first:pt-1">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onNaviguer(e.href)}
                    className="annotation text-signal hover:underline"
                  >
                    {e.source} →
                  </button>
                  <span className="annotation text-texte-faible">{e.score.toFixed(2)}</span>
                </div>
                <p className="text-texte-attenue text-sm leading-relaxed">{e.texte}</p>
              </li>
            ))}
          </ul>

          {reponse.extraits.length > 0 && !reponse.redaction && (
            <button
              type="button"
              onClick={onDemanderRedaction}
              disabled={redigeEnCours}
              className="border-trait text-texte-attenue hover:border-signal hover:text-signal rounded-instrument mt-3 border px-3 py-1.5 text-xs transition-colors disabled:opacity-40"
            >
              {redigeEnCours ? "Rédaction…" : "Demander une réponse rédigée"}
            </button>
          )}
        </>
      )}

      {!reponse && !cherche && (
        <>
          <p className="text-texte-faible mb-3 px-1 text-xs leading-relaxed">
            La recherche s&apos;exécute dans votre navigateur, sur 49 passages vectorisés du site.
            Chaque réponse cite ses sources — c&apos;est le portage web de{" "}
            <Link href="/travaux/mon-rag" className="text-signal hover:underline">
              mon-rag
            </Link>
            , avec le même modèle.
          </p>
          <p className="annotation mb-2">Exemples</p>
          <ul className="flex flex-wrap gap-1.5">
            {QUESTIONS_TYPES.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => onChoisir(q)}
                  className="border-trait text-texte-attenue hover:border-signal hover:text-signal rounded-instrument border px-2.5 py-1 text-xs transition-colors"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
