"use client";

import { useMemo } from "react";

import { LABO } from "@/content/interface";
import { t, type Langue } from "@/lib/langue";

import { Toile, type Pilote } from "./toile";

/** `voisins` est conservé d'une frame à l'autre : il sert au rendu. */
type Boid = { x: number; y: number; vx: number; vy: number; voisins: number };

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
export function Boids({ langue }: { langue: Langue }) {
  const pilote = useMemo<Pilote>(() => {
    const sim = { troupe: [] as Boid[] };

    return {
      initialiser({ largeur, hauteur }) {
        /*
         * Densité constante par surface : la nuée reste lisible quelle que soit
         * la largeur d'écran, au lieu d'être étouffée sur mobile.
         *
         * Le diviseur est passé de 5200 à 2400 après vérification en capture :
         * une cinquantaine d'individus dans un cadre de 640 × 400 se lisaient
         * comme de la poussière dispersée, pas comme une nuée — et un
         * comportement collectif qu'on ne perçoit pas ne démontre rien.
         */
        const nombre = Math.round((largeur * hauteur) / 2400);
        sim.troupe = Array.from({ length: nombre }, () => {
          const angle = Math.random() * Math.PI * 2;
          const v = VITESSE_MIN + Math.random() * (VITESSE_MAX - VITESSE_MIN);
          return {
            x: Math.random() * largeur,
            y: Math.random() * hauteur,
            vx: Math.cos(angle) * v,
            vy: Math.sin(angle) * v,
            voisins: 0,
          };
        });
      },

      dessiner({ ctx, largeur, hauteur, dt, souris }) {
        // Le citron marque les individus rapides ; le gris moyen les autres.
        // La version précédente employait le gris le plus faible de la palette,
        // à moitié transparent : sur fond sombre, les boids étaient invisibles.
        const rapideCouleur = jeton("--citron", "#e8ff54");
        const attenue = jeton("--texte-attenue", "#a5a5b2");

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

          b.voisins = voisins;

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

        /*
         * Rendu : un chevron orienté par la vitesse, plus lisible qu'un point.
         *
         * **La couleur encode le nombre de voisins perçus**, pas la vitesse.
         * La version précédente colorait les individus « rapides », mais la
         * vitesse est bornée par le modèle et le seuil ne se déclenchait
         * pratiquement jamais : la nuée restait uniformément grise, donc muette.
         * Le voisinage, lui, varie énormément — et c'est exactement la grandeur
         * que la démonstration prétend illustrer. On voit désormais les
         * agrégats se former et se défaire.
         */
        for (const b of sim.troupe) {
          const angle = Math.atan2(b.vy, b.vx);
          const groupe = b.voisins >= 4;
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(angle);
          ctx.fillStyle = groupe ? rapideCouleur : attenue;
          ctx.globalAlpha = groupe ? 1 : 0.62;
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-4.6, 3.5);
          ctx.lineTo(-4.6, -3.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      },
    };
  }, []);

  return <Toile pilote={pilote} langue={langue} label={t(LABO.labelNuee, langue)} />;
}
