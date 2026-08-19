"use client";

import { useState } from "react";

import { EVALUATIONS } from "@/content/evaluations";
import { noter, type Bilan } from "@/lib/evaluation";
import { locale, t, type Langue } from "@/lib/langue";
import { LIBELLE_ETAPE_RAG, type EtapeRag } from "@/lib/rag-types";

const MOTS = {
  fr: {
    lancer: "Rejouer l'évaluation ici",
    encours: (n: number, total: number) => `Question ${n} sur ${total}…`,
    fini: "Recalculé dans votre navigateur",
    identique: "Identique aux chiffres publiés.",
    different: "Différent des chiffres publiés. Voir ci-dessous.",
    echec: "Le moteur n'a pas pu démarrer.",
    rappel: "Rappel@4",
    mrr: "Rang réciproque moyen",
    precision: "Précision@4",
    silence: "Silence",
    note: "Le modèle de vectorisation se télécharge une fois, puis dix-huit questions sont vectorisées et classées sur votre machine. Rien ne part sur le réseau.",
  },
  en: {
    lancer: "Replay the evaluation here",
    encours: (n: number, total: number) => `Question ${n} of ${total}…`,
    fini: "Recomputed in your browser",
    identique: "Identical to the published figures.",
    different: "Different from the published figures. See below.",
    echec: "The engine could not start.",
    rappel: "Recall@4",
    mrr: "Mean reciprocal rank",
    precision: "Precision@4",
    silence: "Silence",
    note: "The embedding model downloads once, then eighteen questions are embedded and ranked on your machine. Nothing leaves over the network.",
  },
} as const;

type Etat =
  | { phase: "inactif" }
  | { phase: "chargement"; etape: EtapeRag }
  | { phase: "calcul"; fait: number }
  | { phase: "fini"; bilan: Bilan }
  | { phase: "echec"; message: string };

/**
 * Rejoue l'évaluation entière dans le navigateur du lecteur.
 *
 * Les chiffres publiés au-dessus sont produits au build. Ils pourraient être
 * n'importe quoi : rien, dans une page statique, ne distingue une mesure d'une
 * affirmation. Ce bouton retire la question, en refaisant tourner le même code
 * sur les mêmes vecteurs, chez le lecteur.
 *
 * Le résultat doit tomber sur les mêmes valeurs au centième près. S'il en
 * différait, ce serait soit que les vecteurs versionnés ne correspondent plus
 * au contenu — ce qu'un script de build refuse déjà — soit que les chiffres
 * publiés ont été écrits à la main. L'écart est donc affiché, pas masqué.
 */
export function Banc({ langue, publie }: { langue: Langue; publie: Bilan }) {
  const mots = MOTS[langue];
  const [etat, setEtat] = useState<Etat>({ phase: "inactif" });

  async function rejouer() {
    setEtat({ phase: "chargement", etape: "modele" });
    try {
      const { moteurRag, classer } = await import("@/lib/rag");
      const moteur = await moteurRag(langue, (etape) => setEtat({ phase: "chargement", etape }));

      const rendus = [];
      for (let i = 0; i < EVALUATIONS.length; i++) {
        setEtat({ phase: "calcul", fait: i });
        const cas = EVALUATIONS[i];
        const q = await moteur.vectoriser(t(cas.question, langue));
        const extraits = classer(q, moteur.vecteurs, moteur.meta.passages, moteur.meta.dimensions, 4);
        rendus.push({
          id: cas.id,
          rendus: extraits.map((e) => e.id),
          attendus: cas.attendus,
        });
      }

      setEtat({ phase: "fini", bilan: noter(rendus, 4) });
    } catch (e: unknown) {
      setEtat({ phase: "echec", message: e instanceof Error ? e.message : mots.echec });
    }
  }

  const pc = (v: number) => `${Math.round(v * 100)} %`;

  if (etat.phase === "fini") {
    const memes =
      Math.abs(etat.bilan.rappel - publie.rappel) < 0.005 &&
      Math.abs(etat.bilan.mrr - publie.mrr) < 0.005 &&
      Math.abs(etat.bilan.precision - publie.precision) < 0.005 &&
      Math.abs(etat.bilan.silence - publie.silence) < 0.005;

    return (
      <div className="border-trait bg-fond-eleve rounded-panneau border p-4">
        <p className="annotation text-signal">{mots.fini}</p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {(
            [
              [mots.rappel, pc(etat.bilan.rappel)],
              [mots.mrr, etat.bilan.mrr.toLocaleString(locale(langue), { minimumFractionDigits: 2, maximumFractionDigits: 2 })],
              [mots.precision, pc(etat.bilan.precision)],
              [mots.silence, pc(etat.bilan.silence)],
            ] as const
          ).map(([libelle, valeur]) => (
            <div key={libelle} className="flex items-baseline justify-between gap-3">
              <dt className="annotation">{libelle}</dt>
              <dd className="annotation text-texte tabulaire">{valeur}</dd>
            </div>
          ))}
        </dl>
        <p className={`mt-3 text-sm ${memes ? "text-texte-attenue" : "text-signal"}`}>
          {memes ? mots.identique : mots.different}
        </p>
      </div>
    );
  }

  return (
    <div className="border-trait bg-fond-eleve rounded-panneau border p-4">
      <button
        type="button"
        onClick={() => void rejouer()}
        disabled={etat.phase === "chargement" || etat.phase === "calcul"}
        className="border-trait-fort text-texte hover:bloc-citron border-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors disabled:opacity-40"
      >
        {mots.lancer}
      </button>

      {etat.phase === "chargement" && (
        <p className="annotation text-signal mt-3 animate-pulse">
          {LIBELLE_ETAPE_RAG[langue][etat.etape]}
        </p>
      )}
      {etat.phase === "calcul" && (
        <p className="annotation text-signal mt-3 animate-pulse">
          {mots.encours(etat.fait + 1, EVALUATIONS.length)}
        </p>
      )}
      {etat.phase === "echec" && (
        <p className="border-signal bg-signal-voile text-signal rounded-instrument mt-3 border px-3 py-2 font-mono text-xs">
          {etat.message}
        </p>
      )}

      <p className="text-texte-faible mt-3 text-xs leading-relaxed">{mots.note}</p>
    </div>
  );
}
