"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { useHydrate } from "@/lib/hydrate";
import { locale, type Langue } from "@/lib/langue";

import { NuageCorpus, type PointCorpus } from "./nuage";
import type { Point3D } from "./nuage-3d";

const MOTS = {
  fr: { chargement: "Chargement du rendu 3D…", groupe: "Dimensions de la projection", plan: "Plan", volume: "Volume" },
  en: { chargement: "Loading the 3D view…", groupe: "Projection dimensions", plan: "Plane", volume: "Volume" },
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

  const sources = [...new Set(points.map((p) => p.source))];
  const mots = MOTS[langue];

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

      {en3d ? (
        <Nuage3D points={points3d} variance={variance3d} sources={sources} langue={langue} />
      ) : (
        <NuageCorpus points={points} variance={variance} langue={langue} />
      )}
    </div>
  );
}
