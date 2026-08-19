"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";

import { locale, type Langue } from "@/lib/langue";

const MOTS = {
  fr: {
    variance: "de variance conservée",
    invite:
      "Faites glisser pour orbiter, molette pour approcher. Survolez un point pour lire le passage.",
  },
  en: {
    variance: "of variance retained",
    invite: "Drag to orbit, scroll to zoom. Hover a point to read the passage.",
  },
} as const;

export type Point3D = {
  xyz: [number, number, number];
  source: string;
  href: string;
  apercu: string;
};

/**
 * Le corpus vectorisé, en trois dimensions et orbitable.
 *
 * La troisième composante principale n'est pas là pour faire joli : elle porte
 * huit points de variance de plus que la projection plane — 30,7 % contre
 * 22,4 %. C'est mesuré, affiché, et c'est la seule justification acceptable
 * pour ajouter une dimension à une figure.
 *
 * Cinquante-trois petites sphères plutôt qu'un nuage de points unique : à cette
 * échelle le coût est négligeable, et chacune devient survolable sans avoir à
 * écrire de lancer de rayon à la main.
 */

const COULEURS = ["--serie-1", "--serie-2", "--serie-3", "--serie-4", "--serie-5"];
const REPLIS = ["#2b4cf2", "#ff5a3c", "#e8ff54", "#3ce0c0", "#c07cff"];

function Scene({
  points,
  groupes,
  legende,
  palette,
  trait,
  onSurvol,
}: {
  points: Point3D[];
  groupes: readonly string[];
  legende: readonly string[];
  palette: string[];
  trait: string;
  onSurvol: (i: number | null) => void;
}) {
  // Centré sur l'origine : les coordonnées arrivent dans [0, 1], et une figure
  // qu'on fait tourner doit pivoter autour de son milieu.
  const centre = (v: number) => (v - 0.5) * 2.4;

  return (
    <>
      <ambientLight intensity={1} />

      {/*
        Cube de référence : sans repère, une rotation libre désoriente.

        Il était d'abord dessiné dans la couleur des filets de l'interface, à
        45 % d'opacité — parfaitement invisible sur ce fond, vérification en
        capture à l'appui. Un repère qu'on ne voit pas ne repère rien.
      */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.4, 2.4, 2.4)]} />
        <lineBasicMaterial color={trait} transparent opacity={0.7} />
      </lineSegments>

      {points.map((p, i) => {
        const rang = legende.indexOf(groupes[i]);
        return (
          <mesh
            key={i}
            position={[centre(p.xyz[0]), centre(p.xyz[1]), centre(p.xyz[2])]}
            onPointerOver={(e) => {
              e.stopPropagation();
              onSurvol(i);
            }}
            onPointerOut={() => onSurvol(null)}
          >
            <sphereGeometry args={[0.045, 16, 16]} />
            {/* `meshBasicMaterial` : la couleur doit encoder la source, pas
                l'orientation d'une lumière. */}
            <meshBasicMaterial color={palette[rang % palette.length]} />
          </mesh>
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={2.4}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  );
}

export default function Nuage3D({
  points,
  variance,
  langue,
  etiquettes,
}: {
  points: Point3D[];
  variance: number;
  langue: Langue;
  /** Voir la note de même nom dans `nuage.tsx`. */
  etiquettes?: readonly string[];
}) {
  const mots = MOTS[langue];
  const [survol, setSurvol] = useState<number | null>(null);

  const { palette, trait } = useMemo(() => {
    if (typeof window === "undefined") return { palette: REPLIS, trait: "#7c7c8a" };
    const s = getComputedStyle(document.documentElement);
    const lire = (n: string, r: string) => s.getPropertyValue(n).trim() || r;
    return {
      palette: COULEURS.map((c, i) => lire(c, REPLIS[i])),
      trait: lire("--texte-faible", "#7c7c8a"),
    };
  }, []);

  const groupes =
    etiquettes && etiquettes.length === points.length ? etiquettes : points.map((p) => p.source);
  const legende = [...new Set(groupes)];

  const actif = survol !== null ? points[survol] : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-trait-fort bg-fond-eleve relative aspect-[4/3] w-full border-2">
        <Canvas
          camera={{ position: [3.2, 2.2, 3.2], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          style={{ background: "transparent" }}
        >
          <Scene
            points={points}
            groupes={groupes}
            legende={legende}
            palette={palette}
            trait={trait}
            onSurvol={setSurvol}
          />
        </Canvas>

        <span className="annotation text-texte-faible pointer-events-none absolute right-3 bottom-2">
          {variance.toLocaleString(locale(langue), { minimumFractionDigits: 1 })}
          {langue === "fr" ? " % " : "% "}
          {mots.variance}
        </span>
      </div>

      <div className="border-trait bg-surface min-h-[5.5rem] border p-3">
        {actif ? (
          <>
            <p className="text-corail text-xs font-bold uppercase">{actif.source}</p>
            <p className="text-texte-attenue mt-1.5 text-sm leading-relaxed">{actif.apercu}</p>
          </>
        ) : (
          <p className="text-texte-faible text-sm">
            {mots.invite}
          </p>
        )}
      </div>
    </div>
  );
}
