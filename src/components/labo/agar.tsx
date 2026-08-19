"use client";

import { useMemo, useState } from "react";

import { LABO } from "@/content/interface";
import {
  GAIN_CELLULE,
  GAIN_GRANULE,
  GRANULES,
  MARGE,
  MASSE_DEPART,
  PORTEE_CHASSE,
  PORTEE_FUITE,
  RIVAUX,
  rayon,
  vitesse,
} from "@/lib/agar-regles";
import { t, type Langue } from "@/lib/langue";

import { Toile, type Pilote } from "./toile";

type Cellule = { x: number; y: number; masse: number; vx: number; vy: number; teinte: number };
type Granule = { x: number; y: number; teinte: number };

function jeton(nom: string, repli: string) {
  if (typeof window === "undefined") return repli;
  return getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;
}

/**
 * Agar — jouable.
 *
 * Reprise de mon dépôt `agar`, porté ici en canvas. La cellule suit le
 * curseur, absorbe les granules et les rivaux plus petits qu'elle, et se fait
 * absorber par les plus gros.
 *
 * La règle qui fait tout le jeu tient en une ligne : la vitesse décroît avec
 * la masse. Grossir, c'est gagner en portée et perdre en fuite — et c'est ce
 * seul compromis qui rend la partie intéressante.
 */
export function Agar({ langue }: { langue: Langue }) {
  const [score, setScore] = useState(MASSE_DEPART);
  const [fini, setFini] = useState(false);

  const pilote = useMemo<Pilote>(() => {
    const sim = {
      joueur: null as unknown as Cellule,
      rivaux: [] as Cellule[],
      granules: [] as Granule[],
      perdu: false,
      largeurJeu: 0,
      hauteurJeu: 0,
    };

    const alea = (max: number) => Math.random() * max;

    function nouvelleCellule(masse: number): Cellule {
      return {
        x: alea(sim.largeurJeu),
        y: alea(sim.hauteurJeu),
        masse,
        vx: 0,
        vy: 0,
        teinte: Math.random(),
      };
    }

    function reinitialiser(largeur: number, hauteur: number) {
      sim.largeurJeu = largeur;
      sim.hauteurJeu = hauteur;
      sim.joueur = { x: largeur / 2, y: hauteur / 2, masse: MASSE_DEPART, vx: 0, vy: 0, teinte: -1 };
      sim.rivaux = Array.from({ length: RIVAUX }, () => nouvelleCellule(12 + alea(46)));
      sim.granules = Array.from({ length: GRANULES }, () => ({
        x: alea(largeur),
        y: alea(hauteur),
        teinte: Math.random(),
      }));
      sim.perdu = false;
      setFini(false);
      setScore(MASSE_DEPART);
    }

    /** Déplace une cellule vers une cible, à une vitesse que la masse freine. */
    function vers(c: Cellule, cx: number, cy: number, dt: number) {
      const dx = cx - c.x;
      const dy = cy - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const v = vitesse(c.masse);
      c.x += (dx / d) * v * dt;
      c.y += (dy / d) * v * dt;
      c.x = Math.min(sim.largeurJeu, Math.max(0, c.x));
      c.y = Math.min(sim.hauteurJeu, Math.max(0, c.y));
    }

    return {
      initialiser({ largeur, hauteur }) {
        reinitialiser(largeur, hauteur);
      },

      auClic({ largeur, hauteur }) {
        if (sim.perdu) reinitialiser(largeur, hauteur);
      },

      dessiner({ ctx, largeur, hauteur, dt, souris }) {
        sim.largeurJeu = largeur;
        sim.hauteurJeu = hauteur;

        const signal = jeton("--signal", "#ff8a3d");
        const trait = jeton("--trait", "#23282d");
        const attenue = jeton("--texte-faible", "#666e76");
        const series = ["--serie-2", "--serie-3", "--serie-4", "--serie-5"].map((s, i) =>
          jeton(s, ["#4de1c1", "#7aa2f7", "#c58af9", "#e0af68"][i]),
        );
        const couleurRival = (c: Cellule) => series[Math.floor(c.teinte * series.length) % series.length];

        ctx.clearRect(0, 0, largeur, hauteur);

        if (!sim.perdu) {
          if (souris) vers(sim.joueur, souris.x, souris.y, dt);

          for (const r of sim.rivaux) {
            // IA élémentaire : fuir plus gros, chasser plus petit, sinon errer.
            const dj = Math.hypot(sim.joueur.x - r.x, sim.joueur.y - r.y);
            if (dj < PORTEE_FUITE && sim.joueur.masse > r.masse * MARGE) {
              vers(r, r.x * 2 - sim.joueur.x, r.y * 2 - sim.joueur.y, dt);
            } else if (dj < PORTEE_CHASSE && r.masse > sim.joueur.masse * MARGE) {
              vers(r, sim.joueur.x, sim.joueur.y, dt);
            } else {
              let proche: Granule | null = null;
              let min = Infinity;
              for (const g of sim.granules) {
                const d = (g.x - r.x) ** 2 + (g.y - r.y) ** 2;
                if (d < min) {
                  min = d;
                  proche = g;
                }
              }
              if (proche) vers(r, proche.x, proche.y, dt);
            }
          }

          // Granules absorbés
          const mangeurs = [sim.joueur, ...sim.rivaux];
          for (let i = sim.granules.length - 1; i >= 0; i--) {
            const g = sim.granules[i];
            for (const c of mangeurs) {
              if (Math.hypot(g.x - c.x, g.y - c.y) < rayon(c.masse)) {
                c.masse += GAIN_GRANULE;
                sim.granules[i] = { x: alea(largeur), y: alea(hauteur), teinte: Math.random() };
                break;
              }
            }
          }

          // Collisions entre cellules : le plus gros absorbe, avec une marge
          // de 10 % — sans elle, deux cellules quasi égales se dévorent au
          // hasard des arrondis.
          for (let i = sim.rivaux.length - 1; i >= 0; i--) {
            const r = sim.rivaux[i];
            const d = Math.hypot(r.x - sim.joueur.x, r.y - sim.joueur.y);
            if (d > Math.max(rayon(r.masse), rayon(sim.joueur.masse))) continue;

            if (sim.joueur.masse > r.masse * MARGE) {
              sim.joueur.masse += r.masse * GAIN_CELLULE;
              sim.rivaux[i] = nouvelleCellule(12 + alea(30));
            } else if (r.masse > sim.joueur.masse * MARGE) {
              sim.perdu = true;
              setFini(true);
            }
          }

          setScore(Math.round(sim.joueur.masse));
        }

        // --- Rendu ---------------------------------------------------------
        ctx.strokeStyle = trait;
        ctx.lineWidth = 1;
        for (let x = 0; x < largeur; x += 44) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, hauteur);
          ctx.stroke();
        }
        for (let y = 0; y < hauteur; y += 44) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(largeur, y);
          ctx.stroke();
        }

        ctx.fillStyle = attenue;
        ctx.globalAlpha = 0.55;
        for (const g of sim.granules) {
          ctx.beginPath();
          ctx.arc(g.x, g.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (const r of sim.rivaux) {
          ctx.fillStyle = couleurRival(r);
          ctx.globalAlpha = 0.22;
          ctx.beginPath();
          ctx.arc(r.x, r.y, rayon(r.masse), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = couleurRival(r);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        if (!sim.perdu) {
          ctx.fillStyle = signal;
          ctx.globalAlpha = 0.26;
          ctx.beginPath();
          ctx.arc(sim.joueur.x, sim.joueur.y, rayon(sim.joueur.masse), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = signal;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = signal;
          ctx.font = "600 15px ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.fillText(t(LABO.absorbeRejouer, langue), largeur / 2, hauteur / 2);
        }
      },
    };
    /*
     * `langue` est dans les dépendances pour la forme : elle est constante pour
     * une instance donnée, puisque changer de langue change de page. La citer
     * évite d'avoir à expliquer à chaque relecture pourquoi une valeur lue dans
     * la fermeture n'y figure pas.
     */
  }, [langue]);

  return (
    <div>
      <Toile
        pilote={pilote}
        ratio={16 / 10}
        langue={langue}
        label={t(LABO.labelAgar, langue)}
      />
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.masse, langue)}</dt>
          <dd className="annotation text-texte">{score}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.etat, langue)}</dt>
          <dd className={`annotation ${fini ? "text-signal" : "text-texte"}`}>
            {t(fini ? LABO.absorbe : LABO.enVie, langue)}
          </dd>
        </div>
        <p className="annotation text-texte-faible normal-case">{t(LABO.jouer, langue)}</p>
      </dl>
    </div>
  );
}
