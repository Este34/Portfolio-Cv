"use client";

import { useMemo, useState } from "react";

import { LABO } from "@/content/interface";
import { t, type Langue } from "@/lib/langue";

import { Toile, type Pilote } from "./toile";

type Point = { x: number; y: number; groupe: number };
type Centre = { x: number; y: number; cx: number; cy: number };

const K = 4;
const SERIES = ["--serie-1", "--serie-2", "--serie-3", "--serie-4"];

function jeton(nom: string, repli: string) {
  if (typeof window === "undefined") return repli;
  return getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;
}

/** Loi normale par Box-Muller — des amas crédibles, pas du bruit uniforme. */
function gauss() {
  const u = Math.random() || 1e-9;
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

/**
 * k-moyennes, itération par itération.
 *
 * L'algorithme de Lloyd tient en deux gestes qu'on répète : affecter chaque
 * point au centre le plus proche, puis déplacer chaque centre au barycentre de
 * ce qu'il a récolté. La démonstration les exécute lentement et affiche
 * l'inertie, pour qu'on voie la convergence plutôt que le résultat.
 *
 * Cliquer ajoute un point : c'est là qu'on constate qu'un seul point mal placé
 * peut déplacer une frontière — et pourquoi l'initialisation compte autant.
 */
export function KMeans({ langue }: { langue: Langue }) {
  const [etat, setEtat] = useState({ iteration: 0, inertie: 0, stable: false });

  const pilote = useMemo<Pilote>(() => {
    const sim = {
      points: [] as Point[],
      centres: [] as Centre[],
      accumulateur: 0,
      iteration: 0,
      stableDepuis: 0,
    };

    function semer(largeur: number, hauteur: number) {
      sim.points = [];
      const amas = 4;
      for (let a = 0; a < amas; a++) {
        const mx = largeur * (0.2 + 0.6 * Math.random());
        const my = hauteur * (0.2 + 0.6 * Math.random());
        const ecart = Math.min(largeur, hauteur) * 0.09;
        const n = 40 + Math.floor(Math.random() * 30);
        for (let i = 0; i < n; i++) {
          sim.points.push({
            x: Math.min(largeur, Math.max(0, mx + gauss() * ecart)),
            y: Math.min(hauteur, Math.max(0, my + gauss() * ecart)),
            groupe: -1,
          });
        }
      }
      // Initialisation volontairement naïve (points au hasard) : c'est elle
      // qui rend visible le risque de minimum local que k-means++ corrige.
      sim.centres = Array.from({ length: K }, () => {
        const p = sim.points[Math.floor(Math.random() * sim.points.length)];
        return { x: p.x, y: p.y, cx: p.x, cy: p.y };
      });
      sim.iteration = 0;
      sim.stableDepuis = 0;
    }

    function pas() {
      // Affectation
      let inertie = 0;
      for (const p of sim.points) {
        let meilleur = 0;
        let min = Infinity;
        for (let i = 0; i < sim.centres.length; i++) {
          const d = (p.x - sim.centres[i].cx) ** 2 + (p.y - sim.centres[i].cy) ** 2;
          if (d < min) {
            min = d;
            meilleur = i;
          }
        }
        p.groupe = meilleur;
        inertie += min;
      }

      // Mise à jour des centres
      let deplacement = 0;
      for (let i = 0; i < sim.centres.length; i++) {
        let sx = 0;
        let sy = 0;
        let n = 0;
        for (const p of sim.points) {
          if (p.groupe !== i) continue;
          sx += p.x;
          sy += p.y;
          n++;
        }
        if (n === 0) continue; // Centre orphelin : on le laisse où il est.
        const nx = sx / n;
        const ny = sy / n;
        deplacement += Math.hypot(nx - sim.centres[i].cx, ny - sim.centres[i].cy);
        sim.centres[i].cx = nx;
        sim.centres[i].cy = ny;
      }

      sim.iteration++;
      const stable = deplacement < 0.4;
      if (stable) sim.stableDepuis++;
      else sim.stableDepuis = 0;

      setEtat({
        iteration: sim.iteration,
        inertie: Math.round(inertie / 1000),
        stable: sim.stableDepuis > 0,
      });

      // Une fois convergé et laissé à l'écran un moment, on rejoue.
      return sim.stableDepuis > 14;
    }

    return {
      initialiser({ largeur, hauteur }) {
        semer(largeur, hauteur);
      },

      auClic({ souris }) {
        if (souris) sim.points.push({ x: souris.x, y: souris.y, groupe: -1 });
      },

      dessiner({ ctx, largeur, hauteur, dt }) {
        sim.accumulateur += dt;
        if (sim.accumulateur > 0.55) {
          sim.accumulateur = 0;
          if (pas()) semer(largeur, hauteur);
        }

        // Interpolation vers la position calculée : la convergence se lit
        // comme un mouvement, pas comme une succession de sauts.
        for (const c of sim.centres) {
          c.x += (c.cx - c.x) * Math.min(1, dt * 7);
          c.y += (c.cy - c.y) * Math.min(1, dt * 7);
        }

        const couleurs = SERIES.map((s, i) => jeton(s, ["#ff8a3d", "#4de1c1", "#7aa2f7", "#c58af9"][i]));
        const neutre = jeton("--texte-faible", "#666e76");
        const fond = jeton("--fond-eleve", "#0e1012");

        ctx.clearRect(0, 0, largeur, hauteur);

        for (const p of sim.points) {
          ctx.fillStyle = p.groupe < 0 ? neutre : couleurs[p.groupe % couleurs.length];
          ctx.globalAlpha = 0.62;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        for (let i = 0; i < sim.centres.length; i++) {
          const c = sim.centres[i];
          ctx.strokeStyle = couleurs[i % couleurs.length];
          ctx.fillStyle = fond;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Croix centrale : distingue nettement un centre d'un point.
          ctx.beginPath();
          ctx.moveTo(c.x - 3.5, c.y);
          ctx.lineTo(c.x + 3.5, c.y);
          ctx.moveTo(c.x, c.y - 3.5);
          ctx.lineTo(c.x, c.y + 3.5);
          ctx.stroke();
        }
      },
    };
  }, []);

  return (
    <div>
      <Toile pilote={pilote} langue={langue} label={t(LABO.labelKMoyennes, langue)} />
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.iteration, langue)}</dt>
          <dd className="annotation text-texte">{etat.iteration}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.inertie, langue)}</dt>
          <dd className="annotation text-texte">{etat.inertie}k</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.etat, langue)}</dt>
          <dd className={`annotation ${etat.stable ? "text-signal" : "text-texte"}`}>
            {t(etat.stable ? LABO.converge : LABO.enCours, langue)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
