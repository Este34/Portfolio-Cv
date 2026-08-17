"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Globe abstrait.
 *
 * **Ce n'est pas une carte, et ce n'est pas un jeu de données.** Les points
 * sont répartis mathématiquement sur une sphère et les arcs relient des paires
 * tirées au hasard : aucune géographie, aucun flux réel. C'est une figure, pas
 * une visualisation — le reste du site s'interdit précisément ce genre de
 * raccourci, donc autant l'écrire noir sur blanc ici plutôt que de laisser
 * croire à une carte du commerce mondial.
 *
 * Choix de rendu : matériaux standard de three, pas de shader maison. Un
 * shader donnerait un plus beau résultat, mais chaque ligne de GLSL est une
 * ligne qui peut échouer silencieusement sur une carte graphique que je n'ai
 * pas testée. Ici, ce qui s'affiche s'affiche partout.
 */

/**
 * Répartition de Fibonacci.
 *
 * Une distribution uniforme en latitude/longitude entasse les points aux
 * pôles. La spirale d'or les espace régulièrement sur toute la sphère, et
 * c'est visible immédiatement.
 */
function pointsSphere(nombre: number, rayon: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const or = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nombre; i++) {
    const y = 1 - (i / (nombre - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = or * i;
    points.push(
      new THREE.Vector3(Math.cos(theta) * r * rayon, y * rayon, Math.sin(theta) * r * rayon),
    );
  }
  return points;
}

/** Arc en cloche entre deux points de la sphère, passant au-dessus d'elle. */
function courbe(a: THREE.Vector3, b: THREE.Vector3): THREE.QuadraticBezierCurve3 {
  const milieu = a.clone().add(b).multiplyScalar(0.5);
  // La hauteur suit l'écart : deux points voisins ne doivent pas décrire la
  // même cloche que deux points opposés.
  const hauteur = 1 + a.distanceTo(b) * 0.28;
  return new THREE.QuadraticBezierCurve3(a, milieu.normalize().multiplyScalar(hauteur * 1.6), b);
}

const RAYON = 1.6;
const NB_POINTS = 620;
const NB_ARCS = 22;

function Scene({ signal, attenue, anime }: { signal: string; attenue: string; anime: boolean }) {
  const groupe = useRef<THREE.Group>(null);
  const pulses = useRef<THREE.InstancedMesh>(null);

  const { positions, arcs } = useMemo(() => {
    const pts = pointsSphere(NB_POINTS, RAYON);

    const positions = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });

    // Générateur déterministe : deux rendus successifs doivent donner la même
    // figure, sinon le composant « clignote » à chaque remontage.
    // L'état du générateur vit dans un objet plutôt que dans une variable :
    // réassigner une liaison capturée par une fermeture après le rendu est
    // précisément ce que le compilateur React interdit.
    const etatAlea = { graine: 1337 };
    const alea = () => {
      etatAlea.graine = (etatAlea.graine * 1664525 + 1013904223) % 4294967296;
      return etatAlea.graine / 4294967296;
    };

    const arcs = Array.from({ length: NB_ARCS }, () => {
      const a = pts[Math.floor(alea() * pts.length)];
      const b = pts[Math.floor(alea() * pts.length)];
      return { courbe: courbe(a, b), decalage: alea(), vitesse: 0.1 + alea() * 0.14 };
    });

    return { positions, arcs };
  }, []);

  const objet = useMemo(() => new THREE.Object3D(), []);

  useFrame((etat, delta) => {
    if (groupe.current && anime) groupe.current.rotation.y += delta * 0.075;

    if (!pulses.current) return;
    const t = etat.clock.elapsedTime;
    arcs.forEach((arc, i) => {
      // Progression cyclique le long de l'arc, chaque pulse à son rythme.
      const u = anime ? (arc.decalage + t * arc.vitesse) % 1 : arc.decalage;
      const p = arc.courbe.getPoint(u);
      objet.position.copy(p);
      objet.scale.setScalar(0.022);
      objet.updateMatrix();
      pulses.current!.setMatrixAt(i, objet.matrix);
    });
    pulses.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupe} rotation={[0.32, 0, 0.16]}>
      {/* Sphère pleine, à peine visible : elle masque les points de la face
          arrière et donne sa profondeur à l'ensemble. */}
      <mesh>
        <sphereGeometry args={[RAYON * 0.985, 48, 48]} />
        <meshBasicMaterial color={attenue} transparent opacity={0.06} />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={attenue} size={0.021} sizeAttenuation transparent opacity={0.62} />
      </points>

      {arcs.map((arc, i) => {
        const sommets = new Float32Array(arc.courbe.getPoints(42).flatMap((p) => [p.x, p.y, p.z]));
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[sommets, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={signal} transparent opacity={0.28} />
          </line>
        );
      })}

      <instancedMesh ref={pulses} args={[undefined, undefined, NB_ARCS]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={signal} />
      </instancedMesh>
    </group>
  );
}

export default function Globe({ signal, attenue }: { signal: string; attenue: string }) {
  const anime =
    typeof window === "undefined" ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      camera={{ position: [0, 0, 4.6], fov: 42 }}
      // Plafonner la densité de pixels : au-delà de 2, le coût de rendu double
      // sans gain perceptible.
      dpr={[1, 2]}
      // `frameloop` reste continu : la scène tourne lentement en permanence.
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
    >
      <Scene signal={signal} attenue={attenue} anime={anime} />
    </Canvas>
  );
}
