"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { locale, type Langue } from "@/lib/langue";

import { NuageCorpus, type PointCorpus } from "./nuage";
import type { Point3D } from "./nuage-3d";

const MOTS = {
  fr: { chargement: "Chargement du rendu 3D…", groupe: "Dimensions de la projection", plan: "Plan", volume: "Volume" },
  en: { chargement: "Loading the 3D view…", groupe: "Projection dimensions", plan: "Plane", volume: "Volume" },
} as const;

/**
 * Trois dimensions chargées à la demande.
 *
 * La vue plane est en canvas : quelques kilo-octets, aucune dépendance, et elle
 * fonctionne partout. La vue orbitale demande Three.js, plusieurs centaines de
 * kilo-octets — elle ne descend donc que si le visiteur la réclame, et la vue
 * plane reste le défaut.
 *
 * C'est aussi ce qui garantit que la section reste lisible sans WebGL.
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
  const [en3d, setEn3d] = useState(false);
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
            onClick={() => setEn3d(valeur)}
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
