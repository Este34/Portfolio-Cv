"use client";

import { useMemo, useState } from "react";

import {
  LOT,
  apprendre,
  avant,
  creerAlea,
  initialiser,
  justesse,
  spirales,
  type Exemple,
} from "@/lib/mlp";

import { Toile, type Pilote } from "./toile";

function jeton(nom: string, repli: string) {
  if (typeof window === "undefined") return repli;
  return getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;
}

/** Finesse de l'échantillonnage du champ de décision. */
const GRILLE_X = 56;
const GRILLE_Y = 40;

/**
 * Réseau de neurones en apprentissage, rendu image par image.
 *
 * Les mathématiques vivent dans `lib/mlp.ts`, sans dépendance à React — c'est
 * ce qui permet de vérifier en Node que le réseau apprend réellement, et non
 * qu'il affiche seulement une animation convaincante.
 */
export function Reseau() {
  const [etat, setEtat] = useState({ lots: 0, perte: 0.7, justesse: 50 });

  const pilote = useMemo<Pilote>(() => {
    const alea = creerAlea(20260817);
    const sim = {
      reseau: initialiser(alea),
      donnees: spirales(alea),
      lots: 0,
      perte: 0.7,
      justesse: 50,
      historique: [] as number[],
      accumulateur: 0,
      curseur: 0,
      convergeDepuis: 0,
    };

    function repartir() {
      sim.reseau = initialiser(alea);
      sim.lots = 0;
      sim.historique = [];
      sim.curseur = 0;
      sim.convergeDepuis = 0;
    }

    return {
      auClic: repartir,

      dessiner({ ctx, largeur, hauteur, dt }) {
        /*
         * Trois mini-lots par image, et ce nombre est réglé sur l'observation.
         *
         * À quatorze, le réseau atteignait 100 % de justesse en deux secondes :
         * le visiteur arrivait devant une frontière déjà tracée et ne voyait
         * rien se former, ce qui vide la démonstration de son objet. À trois,
         * la convergence prend une dizaine de secondes — assez pour être suivie
         * à l'œil, assez peu pour ne pas lasser.
         */
        for (let n = 0; n < 3; n++) {
          const lot: Exemple[] = [];
          for (let i = 0; i < LOT; i++) {
            lot.push(sim.donnees[sim.curseur % sim.donnees.length]);
            sim.curseur++;
          }
          sim.perte = apprendre(sim.reseau, lot);
          sim.lots++;
        }

        sim.accumulateur += dt;
        if (sim.accumulateur > 0.12) {
          sim.accumulateur = 0;
          sim.historique.push(sim.perte);
          if (sim.historique.length > 200) sim.historique.shift();
          sim.justesse = Math.round(justesse(sim.reseau, sim.donnees));
          setEtat({ lots: sim.lots, perte: sim.perte, justesse: sim.justesse });

          /*
           * Redémarrage automatique une fois la séparation atteinte et tenue
           * quelques secondes. Sans lui, un visiteur qui arrive après la
           * convergence ne voit qu'une image fixe, et la démonstration devient
           * une illustration.
           */
          if (sim.justesse >= 100) {
            sim.convergeDepuis++;
            if (sim.convergeDepuis > 28) repartir();
          } else {
            sim.convergeDepuis = 0;
          }
        }

        // ---- Rendu -----------------------------------------------------
        const bleu = jeton("--bleu", "#2b4cf2");
        const corail = jeton("--corail", "#ff5a3c");
        const citron = jeton("--citron", "#e8ff54");
        const trait = jeton("--trait", "#2c2c36");
        const fond = jeton("--fond-eleve", "#16161c");

        ctx.clearRect(0, 0, largeur, hauteur);

        const hCourbe = 56;
        const hChamp = hauteur - hCourbe;

        /*
         * Le champ de décision est échantillonné sur une grille et peint en
         * pavés. Évaluer un pixel sur deux coûterait des dizaines de milliers
         * de passes avant par image pour un gain visuel nul à cette échelle.
         */
        const pasX = largeur / GRILLE_X;
        const pasY = hChamp / GRILLE_Y;
        for (let i = 0; i < GRILLE_X; i++) {
          for (let j = 0; j < GRILLE_Y; j++) {
            const nx = ((i + 0.5) / GRILLE_X) * 2 - 1;
            const ny = 1 - ((j + 0.5) / GRILLE_Y) * 2;
            const { a3 } = avant(sim.reseau, nx, ny);
            // L'opacité suit la certitude : la frontière apparaît en creux, là
            // où le réseau hésite encore.
            const certitude = Math.abs(a3 - 0.5) * 2;
            ctx.fillStyle = a3 >= 0.5 ? corail : bleu;
            ctx.globalAlpha = 0.05 + certitude * 0.32;
            ctx.fillRect(i * pasX, j * pasY, pasX + 1, pasY + 1);
          }
        }
        ctx.globalAlpha = 1;

        for (const ex of sim.donnees) {
          ctx.beginPath();
          ctx.arc(((ex.x + 1) / 2) * largeur, ((1 - ex.y) / 2) * hChamp, 3.4, 0, Math.PI * 2);
          ctx.fillStyle = ex.classe === 1 ? corail : bleu;
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = fond;
          ctx.stroke();
        }

        // ---- Courbe de perte -------------------------------------------
        ctx.strokeStyle = trait;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, hChamp);
        ctx.lineTo(largeur, hChamp);
        ctx.stroke();

        if (sim.historique.length > 1) {
          const max = Math.max(...sim.historique, 0.1);
          ctx.beginPath();
          sim.historique.forEach((v, i) => {
            const px = (i / (sim.historique.length - 1)) * largeur;
            const py = hChamp + 12 + (1 - v / max) * (hCourbe - 24);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = citron;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      },
    };
  }, []);

  return (
    <div>
      <Toile
        pilote={pilote}
        ratio={16 / 11}
        label="Réseau de neurones apprenant à séparer deux spirales, avec sa courbe de perte"
      />
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-2">
          <dt className="annotation">Lots vus</dt>
          <dd className="annotation text-texte tabulaire">{etat.lots.toLocaleString("fr-FR")}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">Perte</dt>
          <dd className="annotation text-texte tabulaire">{etat.perte.toFixed(3)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">Justesse</dt>
          <dd className={`annotation tabulaire ${etat.justesse >= 95 ? "text-citron" : "text-texte"}`}>
            {etat.justesse} %
          </dd>
        </div>
        <p className="annotation text-texte-faible">Cliquez pour réinitialiser les poids.</p>
      </dl>
    </div>
  );
}
