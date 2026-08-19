"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { useHydrate } from "@/lib/hydrate";
import { locale, type Langue } from "@/lib/langue";

import { NuageCorpus, type PointCorpus } from "./nuage";
import type { Point3D } from "./nuage-3d";
import { K, usePartition } from "./utiliser-partition";

const MOTS = {
  fr: {
    chargement: "Chargement du rendu 3D…",
    groupe: "Dimensions de la projection",
    plan: "Plan",
    volume: "Volume",
    coloration: "Coloration des points",
    parSource: "Par source",
    parGroupe: "Groupes trouvés",
    chargementVecteurs: "Chargement des 384 dimensions…",
    iteration: (n: number) => `Itération ${n}`,
    stabilise: (n: number) => `Stabilisé en ${n} itération${n > 1 ? "s" : ""}`,
    inertie: "inertie",
    explication:
      "k-moyennes sphériques sur les 384 dimensions, pas sur la projection. Personne n'a déclaré ces groupes : chacun porte le nom du passage le plus proche de son centre.",
  },
  en: {
    chargement: "Loading the 3D view…",
    groupe: "Projection dimensions",
    plan: "Plane",
    volume: "Volume",
    coloration: "Point colouring",
    parSource: "By source",
    parGroupe: "Groups found",
    chargementVecteurs: "Loading the 384 dimensions…",
    iteration: (n: number) => `Iteration ${n}`,
    stabilise: (n: number) => `Settled in ${n} iteration${n > 1 ? "s" : ""}`,
    inertie: "inertia",
    explication:
      "Spherical k-means over all 384 dimensions, not over the projection. Nobody declared these groups: each is named after the passage closest to its centre.",
  },
} as const;

/**
 * La vue en volume, par défaut, sans sacrifier la dégradation.
 *
 * ## L'arbitrage, et comment il est tenu
 *
 * La vue orbitale demande Three.js, plusieurs centaines de kilo-octets. C'est
 * le morceau le plus lourd du site après les deux moteurs, et il descend
 * désormais à chaque visite de l'accueil au lieu d'attendre un clic.
 *
 * Ce que ça ne change pas : il reste **hors du premier lot**. Le rendu serveur
 * produit la vue plane, en canvas, quelques kilo-octets et aucune dépendance ;
 * le volume ne la remplace qu'une fois la page hydratée. Un visiteur sans
 * JavaScript, sans WebGL, ou dont la connexion lâche en route garde donc une
 * figure complète et lisible plutôt qu'un cadre vide.
 *
 * C'est aussi pour ça que le défaut n'est pas écrit `useState(true)` : à
 * `true`, le serveur rendrait l'écran d'attente, et ce serait lui la version
 * dégradée.
 */
const Nuage3D = dynamic(() => import("./nuage-3d"), {
  ssr: false,
  loading: () => (
    <div className="border-trait-fort bg-fond-eleve grid aspect-[4/3] w-full place-items-center border-2">
      <span className="annotation text-corail animate-pulse">…</span>
    </div>
  ),
});

export function BasculeNuage({
  points,
  points3d,
  variance,
  variance3d,
  langue,
}: {
  points: PointCorpus[];
  points3d: Point3D[];
  variance: number;
  variance3d: number;
  langue: Langue;
}) {
  /*
   * `null` tant que le visiteur n'a rien choisi : la vue suit alors
   * l'hydratation — plane au rendu serveur, en volume dès que le navigateur a
   * pris la main. Un clic fige le choix et l'hydratation cesse de décider.
   */
  const [choix, setChoix] = useState<boolean | null>(null);
  const hydrate = useHydrate();
  const en3d = choix ?? hydrate;

  const mots = MOTS[langue];

  /*
   * Cinq groupes, et c'est la palette qui l'impose, pas les données.
   *
   * L'inertie mesurée sur ce corpus, médiane sur douze graines, décroît sans
   * coude : 38,6 à k=2, puis 34,7 · 32,5 · 30,0 · 28,4 · 26,6 · 25,3 · 24,4.
   * Chaque groupe supplémentaire gagne à peu près autant que le précédent, ce
   * qui veut dire qu'il n'existe pas de bon nombre de groupes ici : le corpus
   * n'a pas d'amas nets, ce que la faible variance retenue par la projection
   * disait déjà.
   *
   * Le nombre est donc choisi par une contrainte d'affichage — cinq couleurs
   * dans la palette, et une couleur qui se répète ne renseigne plus — et le
   * dire vaut mieux que d'inventer un coude.
   */
  const { etat, demarrer, arreter } = usePartition(
    langue,
    points.map((p) => p.source),
  );
  const parGroupes = etat.phase !== "inactif";
  const etiquettes = etat.phase === "encours" || etat.phase === "fini" ? etat.etiquettes : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={mots.groupe} className="flex">
        {(
          [
            [false, mots.plan, variance],
            [true, mots.volume, variance3d],
          ] as const
        ).map(([valeur, libelle, part]) => (
          <button
            key={libelle}
            type="button"
            onClick={() => setChoix(valeur)}
            aria-pressed={en3d === valeur}
            className={`flex-1 border-2 px-3 py-2 text-xs font-bold uppercase transition-colors ${
              en3d === valeur
                ? "bloc-corail border-corail"
                : "border-trait text-texte-attenue hover:border-trait-fort"
            }`}
          >
            {libelle}
            <span className="ml-2 font-normal opacity-80">
              {part.toLocaleString(locale(langue), { minimumFractionDigits: 1 })}
              {langue === "fr" ? " %" : "%"}
            </span>
          </button>
        ))}
      </div>

      <div role="group" aria-label={mots.coloration} className="flex">
        {(
          [
            [false, mots.parSource],
            [true, mots.parGroupe],
          ] as const
        ).map(([valeur, libelle]) => (
          <button
            key={libelle}
            type="button"
            onClick={() => (valeur ? void demarrer() : arreter())}
            aria-pressed={parGroupes === valeur}
            className={`flex-1 border-2 px-3 py-2 text-xs font-bold uppercase transition-colors ${
              parGroupes === valeur
                ? "bloc-citron border-citron"
                : "border-trait text-texte-attenue hover:border-trait-fort"
            }`}
          >
            {libelle}
            {valeur && parGroupes && (
              <span className="ml-2 font-normal opacity-80">×{K}</span>
            )}
          </button>
        ))}
      </div>

      {en3d ? (
        <Nuage3D
          points={points3d}
          variance={variance3d}
          langue={langue}
          etiquettes={etiquettes}
        />
      ) : (
        <NuageCorpus
          points={points}
          variance={variance}
          langue={langue}
          etiquettes={etiquettes}
        />
      )}

      {parGroupes && (
        <div className="border-trait bg-fond-eleve rounded-panneau border p-3">
          {etat.phase === "chargement" && (
            <p className="annotation text-signal animate-pulse">{mots.chargementVecteurs}</p>
          )}
          {etat.phase === "echec" && (
            <p className="annotation text-signal">{etat.message}</p>
          )}
          {(etat.phase === "encours" || etat.phase === "fini") && (
            <>
              <p className="annotation">
                <span className={etat.phase === "encours" ? "text-signal animate-pulse" : "text-texte"}>
                  {etat.phase === "encours"
                    ? mots.iteration(etat.iterations)
                    : mots.stabilise(etat.iterations)}
                </span>
                <span className="text-texte-faible ml-3">
                  {mots.inertie} {etat.inertie.toLocaleString(locale(langue), { maximumFractionDigits: 1 })}
                </span>
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {etat.legende.map((g, i) => (
                  <li key={g.nom} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: `var(--serie-${(i % 5) + 1})` }}
                    />
                    <span className="annotation text-texte-attenue">
                      {g.nom} <span className="text-texte-faible">×{g.taille}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-texte-faible mt-2 text-xs leading-relaxed">{mots.explication}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
