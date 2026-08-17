"use client";

import { useMemo } from "react";

import { Toile, type Pilote } from "./toile";

type Boid = { x: number; y: number; vx: number; vy: number };

const SEPARATION = 22;
const PERCEPTION = 58;
const VITESSE_MAX = 105;
const VITESSE_MIN = 45;

/** Lit un jeton du thème pour que la simulation suive le mode clair/sombre. */
function jeton(nom: string, repli: string) {
  if (typeof window === "undefined") return repli;
  return getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;
}

/**
 * Nuée — trois règles locales, aucune coordination centrale.
 *
 * Séparation, alignement, cohésion : chaque individu ne regarde que ses
 * voisins immédiats, et la forme du groupe n'est écrite nulle part. C'est le
 * plus court chemin pour montrer qu'un comportement collectif lisible peut
 * naître de règles qui ne le mentionnent jamais.
 *
 * Le curseur agit en prédateur : les boids s'en écartent.
 */
export function Boids() {
  const pilote = useMemo<Pilote>(() => {
    const sim = { troupe: [] as Boid[] };

    return {
      initialiser({ largeur, hauteur }) {
        // Densité constante par surface : la nuée reste lisible quelle que
        // soit la largeur d'écran, au lieu d'être étouffée sur mobile.
        const nombre = Math.round((largeur * hauteur) / 5200);
        sim.troupe = Array.from({ length: nombre }, () => {
          const angle = Math.random() * Math.PI * 2;
          const v = VITESSE_MIN + Math.random() * (VITESSE_MAX - VITESSE_MIN);
          return {
            x: Math.random() * largeur,
            y: Math.random() * hauteur,
            vx: Math.cos(angle) * v,
            vy: Math.sin(angle) * v,
          };
        });
      },

      dessiner({ ctx, largeur, hauteur, dt, souris }) {
        const signal = jeton("--signal", "#ff8a3d");
        const attenue = jeton("--texte-faible", "#666e76");

        ctx.clearRect(0, 0, largeur, hauteur);

        for (const b of sim.troupe) {
          let sx = 0;
          let sy = 0;
          let ax = 0;
          let ay = 0;
          let cx = 0;
          let cy = 0;
          let voisins = 0;

          for (const autre of sim.troupe) {
            if (autre === b) continue;
            const dx = autre.x - b.x;
            const dy = autre.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > PERCEPTION * PERCEPTION || d2 === 0) continue;

            voisins++;
            ax += autre.vx;
            ay += autre.vy;
            cx += autre.x;
            cy += autre.y;

            if (d2 < SEPARATION * SEPARATION) {
              // Répulsion inversement proportionnelle à la distance : douce
              // de loin, ferme de près.
              const d = Math.sqrt(d2);
              sx -= (dx / d) * (SEPARATION - d);
              sy -= (dy / d) * (SEPARATION - d);
            }
          }

          if (voisins > 0) {
            b.vx += (ax / voisins - b.vx) * 0.9 * dt;
            b.vy += (ay / voisins - b.vy) * 0.9 * dt;
            b.vx += (cx / voisins - b.x) * 0.6 * dt;
            b.vy += (cy / voisins - b.y) * 0.6 * dt;
          }
          b.vx += sx * 7 * dt;
          b.vy += sy * 7 * dt;

          if (souris) {
            const dx = b.x - souris.x;
            const dy = b.y - souris.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 110 * 110 && d2 > 1) {
              const d = Math.sqrt(d2);
              b.vx += (dx / d) * 260 * dt;
              b.vy += (dy / d) * 260 * dt;
            }
          }

          const v = Math.hypot(b.vx, b.vy) || 1;
          const cible = Math.min(Math.max(v, VITESSE_MIN), VITESSE_MAX);
          b.vx = (b.vx / v) * cible;
          b.vy = (b.vy / v) * cible;

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // Tore : sortir par un bord, c'est rentrer par l'opposé.
          if (b.x < 0) b.x += largeur;
          else if (b.x > largeur) b.x -= largeur;
          if (b.y < 0) b.y += hauteur;
          else if (b.y > hauteur) b.y -= hauteur;
        }

        // Rendu : un chevron orienté par la vitesse, plus lisible qu'un point.
        for (const b of sim.troupe) {
          const angle = Math.atan2(b.vy, b.vx);
          const rapide = Math.hypot(b.vx, b.vy) > VITESSE_MAX * 0.86;
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(angle);
          ctx.fillStyle = rapide ? signal : attenue;
          ctx.globalAlpha = rapide ? 0.95 : 0.5;
          ctx.beginPath();
          ctx.moveTo(5, 0);
          ctx.lineTo(-3.5, 2.6);
          ctx.lineTo(-3.5, -2.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      },
    };
  }, []);

  return <Toile pilote={pilote} label="Simulation de nuée : chaque individu suit trois règles locales" />;
}
