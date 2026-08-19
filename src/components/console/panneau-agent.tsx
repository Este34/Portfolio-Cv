"use client";

import {
  LIBELLE_OUTIL,
  LIBELLE_REGIME,
  MAX_TOURS,
  TACHES_TYPES,
  type Etape,
  type EtatAgent,
  type Observation,
  type Resultat,
} from "@/lib/agent-types";
import type { Langue } from "@/lib/langue";

const MOTS = {
  fr: {
    intro:
      "La console offrait déjà trois choses : aller à une page, écrire du SQL, interroger le corpus. L'agent n'en reçoit pas une quatrième, il reçoit une boucle : il décide, appelle un outil, lit le résultat, recommence. La page change réellement derrière ce panneau.",
    exemples: "Exemples",
    reflexion: "Décision…",
    outilEnCours: "Outil en cours…",
    reponse: "Réponse",
    trace: "Trace",
    tours: (n: number) => `${n} tour${n > 1 ? "s" : ""} sur ${MAX_TOURS}`,
    repli: "modèle indisponible, repli sur le planificateur déterministe",
    epuise:
      "L'agent a épuisé ses tours sans conclure. Le plafond est là pour ça, et la trace ci-dessus montre où il tournait en rond.",
    passages: (n: number) => `${n} passage${n > 1 ? "s" : ""}`,
    lignes: (n: number) => `${n} ligne${n > 1 ? "s" : ""}`,
    pageOuverte: "page ouverte",
    voirLaPage: "Fermer et voir la page",
    sansCle:
      "Aucune clé n'est configurée sur ce déploiement : c'est le planificateur déterministe qui tourne, entièrement dans votre navigateur.",
  },
  en: {
    intro:
      "The console already offered three things: go to a page, write SQL, query the corpus. The agent gets no fourth one, it gets a loop: it decides, calls a tool, reads the result, starts again. The page really does change behind this panel.",
    exemples: "Examples",
    reflexion: "Deciding…",
    outilEnCours: "Running the tool…",
    reponse: "Answer",
    trace: "Trace",
    tours: (n: number) => `${n} turn${n > 1 ? "s" : ""} of ${MAX_TOURS}`,
    repli: "model unavailable, fell back to the deterministic planner",
    epuise:
      "The agent ran out of turns without concluding. That is what the cap is for, and the trace above shows where it was going in circles.",
    passages: (n: number) => `${n} passage${n > 1 ? "s" : ""}`,
    lignes: (n: number) => `${n} row${n > 1 ? "s" : ""}`,
    pageOuverte: "page opened",
    voirLaPage: "Close and see the page",
    sansCle:
      "No key is configured on this deployment: the deterministic planner is what runs, entirely inside your browser.",
  },
} as const;

/**
 * Le panneau de l'agent : la trace, pas seulement la réponse.
 *
 * Une réponse qui tombe d'un coup ne prouve rien, et c'est le reproche
 * ordinaire fait aux démonstrations d'agents. Ici chaque tour est affiché avec
 * l'outil appelé, son argument tel qu'il a été passé, et ce que l'outil a
 * renvoyé. Le visiteur peut vérifier que la requête SQL affichée est bien celle
 * qui a produit le tableau au-dessous.
 */
export function PanneauAgent({
  langue,
  etat,
  etapes,
  resultat,
  onChoisir,
  onNaviguer,
  onFermer,
}: {
  langue: Langue;
  etat: EtatAgent;
  etapes: readonly Etape[];
  resultat: Resultat | null;
  onChoisir: (tache: string) => void;
  onNaviguer: (href: string) => void;
  onFermer: () => void;
}) {
  const mots = MOTS[langue];
  const enCours = etat === "reflexion" || etat === "outil";
  const pageVisitee = etapes.find((e) => e.observation.type === "page")?.observation;

  if (etat === "inactif") {
    return (
      <div className="p-3">
        <p className="text-texte-faible mb-3 px-1 text-xs leading-relaxed">{mots.intro}</p>
        <p className="annotation mb-2">{mots.exemples}</p>
        <ul className="flex flex-wrap gap-1.5">
          {TACHES_TYPES[langue].map((tache) => (
            <li key={tache}>
              <button
                type="button"
                onClick={() => onChoisir(tache)}
                className="border-trait text-texte-attenue hover:border-signal hover:text-signal rounded-instrument border px-2.5 py-1 text-xs transition-colors"
              >
                {tache}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
        <span className="annotation">
          {mots.trace} · {mots.tours(etapes.length)}
        </span>
        {resultat && (
          <span className="annotation text-texte-faible">
            {LIBELLE_REGIME[langue][resultat.regime]} · {resultat.duree.toFixed(0)} ms
          </span>
        )}
      </div>

      {resultat?.repli && (
        <p className="border-trait text-texte-faible rounded-instrument mb-3 border border-dashed px-3 py-2 text-xs">
          {mots.repli}
        </p>
      )}

      <ol className="divide-trait divide-y">
        {etapes.map((e) => (
          <li key={e.tour} className="py-2.5 first:pt-1">
            <div className="flex items-baseline gap-2">
              <span className="annotation text-signal shrink-0">
                {String(e.tour).padStart(2, "0")}
              </span>
              <span className="annotation shrink-0">{LIBELLE_OUTIL[langue][e.action.outil]}</span>
              <span className="annotation text-texte-faible ml-auto shrink-0">
                {e.duree.toFixed(0)} ms
              </span>
            </div>

            {e.action.outil !== "repondre" && (
              <p className="text-texte-attenue mt-1 pl-7 font-mono text-xs break-words whitespace-pre-wrap">
                {e.action.argument}
              </p>
            )}

            <div className="mt-1.5 pl-7">
              <VueObservation
                observation={e.observation}
                langue={langue}
                onNaviguer={onNaviguer}
              />
            </div>
          </li>
        ))}
      </ol>

      {enCours && (
        <p className="annotation text-signal animate-pulse px-1 py-3">
          {etat === "reflexion" ? mots.reflexion : mots.outilEnCours}
        </p>
      )}

      {resultat?.reponse && (
        <div className="border-signal bg-signal-voile rounded-instrument mt-3 border p-3">
          <p className="annotation text-signal mb-1.5">{mots.reponse}</p>
          <p className="text-texte text-sm leading-relaxed">{resultat.reponse}</p>
        </div>
      )}

      {resultat && resultat.reponse === null && (
        <p className="text-texte-attenue mt-3 px-1 text-sm leading-relaxed">{mots.epuise}</p>
      )}

      {resultat && pageVisitee?.type === "page" && (
        <button
          type="button"
          onClick={() => {
            onNaviguer(pageVisitee.href);
            onFermer();
          }}
          className="border-signal text-signal hover:bg-signal-voile rounded-instrument mt-3 border px-3 py-1.5 text-xs transition-colors"
        >
          {mots.voirLaPage} →
        </button>
      )}
    </div>
  );
}

function VueObservation({
  observation,
  langue,
  onNaviguer,
}: {
  observation: Observation;
  langue: Langue;
  onNaviguer: (href: string) => void;
}) {
  const mots = MOTS[langue];

  if (observation.type === "erreur") {
    return (
      <p className="border-signal bg-signal-voile text-signal rounded-instrument border px-2.5 py-1.5 font-mono text-xs">
        {observation.message}
      </p>
    );
  }

  if (observation.type === "texte") return null;

  if (observation.type === "page") {
    return (
      <button
        type="button"
        onClick={() => onNaviguer(observation.href)}
        className="annotation text-signal hover:underline"
      >
        {mots.pageOuverte} : {observation.label} →
      </button>
    );
  }

  if (observation.type === "extraits") {
    return (
      <>
        <p className="annotation text-texte-faible mb-1">
          {mots.passages(observation.extraits.length)}
        </p>
        <ul className="space-y-1.5">
          {observation.extraits.slice(0, 3).map((e, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onNaviguer(e.href)}
                  className="annotation text-signal hover:underline"
                >
                  {e.source} →
                </button>
                <span className="annotation text-texte-faible">{e.score.toFixed(2)}</span>
              </div>
              <p className="text-texte-attenue line-clamp-3 text-xs leading-relaxed">{e.texte}</p>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const { colonnes, lignes } = observation.resultat;
  return (
    <>
      <p className="annotation text-texte-faible mb-1">{mots.lignes(lignes.length)}</p>
      <div className="border-trait rounded-instrument overflow-x-auto border">
        <table className="w-full text-left text-xs">
          <thead className="border-trait bg-surface border-b">
            <tr>
              {colonnes.map((c) => (
                <th key={c} className="annotation px-2.5 py-1.5 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-trait divide-y">
            {lignes.slice(0, 12).map((ligne, i) => (
              <tr key={i}>
                {ligne.map((cell, j) => (
                  <td key={j} className="text-texte-attenue px-2.5 py-1 align-top font-mono">
                    {cell === null ? <span className="text-texte-faible">∅</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
