"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { NuageCorpus, type PointCorpus } from "./nuage";
import type { Point3D } from "./nuage-3d";

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
      <span className="annotation text-corail animate-pulse">Chargement du rendu 3D…</span>
    </div>
  ),
});

export function BasculeNuage({
  points,
  points3d,
  variance,
  variance3d,
}: {
  points: PointCorpus[];
  points3d: Point3D[];
  variance: number;
  variance3d: number;
}) {
  const [en3d, setEn3d] = useState(false);
  const sources = [...new Set(points.map((p) => p.source))];

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Dimensions de la projection" className="flex">
        {(
          [
            [false, "Plan", variance],
            [true, "Volume", variance3d],
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
              {String(part).replace(".", ",")} %
            </span>
          </button>
        ))}
      </div>

      {en3d ? (
        <Nuage3D points={points3d} variance={variance3d} sources={sources} />
      ) : (
        <NuageCorpus points={points} variance={variance} />
      )}
    </div>
  );
}
