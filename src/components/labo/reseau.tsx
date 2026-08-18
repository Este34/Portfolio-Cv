"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { LABO } from "@/content/interface";
import { locale, t, type Langue } from "@/lib/langue";
import {
  FORMES,
  LOT,
  apprendre,
  avant,
  creerAlea,
  fabriquer,
  initialiser,
  justesse,
  plafondLineaire,
  type Exemple,
  type NomForme,
} from "@/lib/mlp";

import { Toile, type Pilote } from "./toile";

function jeton(nom: string, repli: string) {
  if (typeof window === "undefined") return repli;
  return getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;
}

/** Finesse de l'échantillonnage du champ de décision. */
const GRILLE_X = 56;
const GRILLE_Y = 40;
/** Hauteur réservée à la courbe de perte, en pixels. */
const H_COURBE = 56;

type Ordre = "nouvelle" | "effacer" | null;

/**
 * Réseau de neurones en apprentissage, sur une forme tirée au sort.
 *
 * ## Ce que la forme aléatoire change
 *
 * La version précédente montrait toujours les mêmes deux spirales. Elle
 * démontrait donc une seule chose : que ce réseau sait faire *ces* spirales, ce
 * qu'un lecteur méfiant pouvait attribuer à des réglages taillés sur mesure.
 *
 * Six formes tirées au sort à chaque visite, et le même réseau sans un
 * paramètre changé : c'est ce qui rend la démonstration crédible. Deux lunes,
 * des bandes, des spirales, des anneaux, quatre amas en OU exclusif, un damier.
 *
 * ## Le plafond linéaire, affiché à côté
 *
 * « Le réseau atteint 100 % » ne dit rien tant qu'on ignore si le problème
 * était difficile. La page affiche donc, en face, la justesse du **meilleur
 * demi-plan possible** sur les mêmes points, calculée exactement à
 * l'orientation près. L'écart entre les deux nombres est la seule mesure
 * honnête de ce que le non-linéaire apporte : de douze points sur deux lunes à
 * près de quarante sur un damier.
 *
 * Les mathématiques vivent dans `lib/mlp.ts`, sans dépendance à React, ce qui
 * permet de vérifier en Node que le réseau apprend réellement.
 */
export function Reseau({ langue }: { langue: Langue }) {
  const [etat, setEtat] = useState({
    lots: 0,
    perte: 0.7,
    justesse: 50,
    points: 0,
    plafond: 0,
    forme: null as NomForme | null,
  });
  const [classe, setClasse] = useState<0 | 1>(1);
  const [libre, setLibre] = useState(false);

  /*
   * Les ordres passent du panneau de commandes vers la boucle de rendu par une
   * référence : la boucle vit dans un `useMemo` monté une seule fois et ne
   * verrait jamais un état React qui change.
   *
   * Une référence et non un objet mémoïsé, parce que le compilateur React
   * traite le résultat d'un `useMemo` comme immuable et refuse qu'on y écrive.
   */
  const canal = useRef<{ classe: 0 | 1; ordre: Ordre }>({ classe: 1, ordre: null });

  const choisirClasse = useCallback((v: 0 | 1) => {
    canal.current.classe = v;
    setClasse(v);
  }, []);

  const commander = useCallback((ordre: Exclude<Ordre, null>) => {
    canal.current.ordre = ordre;
    setLibre(ordre === "effacer");
  }, []);

  const pilote = useMemo<Pilote>(() => {
    /*
     * Graine tirée au hasard, contrairement à tout le reste du site.
     *
     * C'est la seule valeur non reproductible du portfolio, et elle est
     * délibérée : deux visites doivent montrer deux problèmes différents.
     *
     * Le tirage n'a **pas** lieu ici mais à la première image dessinée. Deux
     * raisons, et la première est une règle : `Math.random()` pendant le
     * rendu est impur, et le compilateur React le refuse à juste titre — deux
     * rendus du même composant rendraient deux choses. La seconde est
     * pratique : la boucle de dessin ne tourne que dans le navigateur, ce qui
     * écarte d'office toute divergence entre rendu serveur et rendu client.
     */
    let alea: (() => number) | null = null;
    const tirerForme = () => FORMES[Math.floor(alea!() * FORMES.length)];

    const sim = {
      reseau: null as ReturnType<typeof initialiser> | null,
      donnees: [] as Exemple[],
      forme: null as NomForme | null,
      plafond: 0,
      lots: 0,
      perte: 0.7,
      justesse: 50,
      historique: [] as number[],
      accumulateur: 0,
      curseur: 0,
      convergeDepuis: 0,
      libre: false,
    };

    /** Premier passage : on tire la graine, puis une forme. */
    function amorcer() {
      if (alea) return;
      alea = creerAlea(Math.floor(Math.random() * 2 ** 31));
      const forme = tirerForme();
      repartir(fabriquer(forme, alea), forme);
    }

    function repartir(donnees?: Exemple[], forme?: NomForme | null) {
      sim.reseau = initialiser(alea!);
      if (donnees) sim.donnees = donnees;
      if (forme !== undefined) sim.forme = forme;
      /*
       * Le plafond est recalculé à chaque changement de jeu. En mode libre, il
       * l'est aussi à chaque point posé : c'est le seul moyen pour que le
       * nombre affiché décrive les points réellement à l'écran, et le calcul
       * reste sous la milliseconde à cette taille.
       */
      sim.plafond = plafondLineaire(sim.donnees);
      sim.lots = 0;
      sim.historique = [];
      sim.curseur = 0;
      sim.convergeDepuis = 0;
    }

    return {
      /** Un clic dépose un point de la classe choisie, ou relance. */
      auClic({ largeur, hauteur, souris }) {
        if (!souris || !alea) return;
        const hChamp = hauteur - H_COURBE;
        if (souris.y > hChamp) return; // clic dans la bande de la courbe

        if (!sim.libre) {
          repartir();
          return;
        }
        sim.donnees.push({
          x: (souris.x / largeur) * 2 - 1,
          y: 1 - (souris.y / hChamp) * 2,
          classe: canal.current.classe,
        });
        sim.plafond = plafondLineaire(sim.donnees);
      },

      dessiner({ ctx, largeur, hauteur, dt }) {
        amorcer();

        if (canal.current.ordre === "nouvelle") {
          sim.libre = false;
          const forme = tirerForme();
          repartir(fabriquer(forme, alea!), forme);
          canal.current.ordre = null;
        } else if (canal.current.ordre === "effacer") {
          sim.libre = true;
          repartir([], null);
          canal.current.ordre = null;
        }

        /*
         * Trois mini-lots par image, réglé sur l'observation : à quatorze, le
         * réseau convergeait en deux secondes et le visiteur arrivait devant
         * une frontière déjà tracée, ce qui vide la démonstration de son objet.
         *
         * Rien n'est appris tant que les deux classes ne sont pas représentées :
         * un réseau nourri d'une seule classe apprend « tout est 1 » et affiche
         * 100 % de justesse, ce qui serait un mensonge à l'écran.
         */
        const deuxClasses =
          sim.donnees.length >= 2 && new Set(sim.donnees.map((e) => e.classe)).size === 2;

        if (deuxClasses) {
          for (let n = 0; n < 3; n++) {
            const lot: Exemple[] = [];
            for (let i = 0; i < LOT; i++) {
              lot.push(sim.donnees[sim.curseur % sim.donnees.length]);
              sim.curseur++;
            }
            sim.perte = apprendre(sim.reseau!, lot);
            sim.lots++;
          }
        }

        sim.accumulateur += dt;
        if (sim.accumulateur > 0.12) {
          sim.accumulateur = 0;
          if (deuxClasses) {
            sim.historique.push(sim.perte);
            if (sim.historique.length > 200) sim.historique.shift();
            sim.justesse = Math.round(justesse(sim.reseau!, sim.donnees));
          }
          setEtat({
            lots: sim.lots,
            perte: sim.perte,
            justesse: deuxClasses ? sim.justesse : 0,
            points: sim.donnees.length,
            plafond: deuxClasses ? sim.plafond : 0,
            forme: sim.forme,
          });

          /*
           * Une fois la séparation tenue quelques secondes, on tire une autre
           * forme plutôt que de rejouer la même : c'est ce qui fait qu'un
           * visiteur qui reste en voit plusieurs. En mode libre, jamais —
           * effacer le dessin de quelqu'un sous ses yeux serait insupportable.
           */
          if (!sim.libre && sim.justesse >= 100) {
            sim.convergeDepuis++;
            if (sim.convergeDepuis > 28) {
              const forme = tirerForme();
              repartir(fabriquer(forme, alea!), forme);
            }
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
        const faible = jeton("--texte-faible", "#7c7c8a");

        ctx.clearRect(0, 0, largeur, hauteur);
        const hChamp = hauteur - H_COURBE;

        if (deuxClasses) {
          const pasX = largeur / GRILLE_X;
          const pasY = hChamp / GRILLE_Y;
          for (let i = 0; i < GRILLE_X; i++) {
            for (let j = 0; j < GRILLE_Y; j++) {
              const nx = ((i + 0.5) / GRILLE_X) * 2 - 1;
              const ny = 1 - ((j + 0.5) / GRILLE_Y) * 2;
              const { a3 } = avant(sim.reseau!, nx, ny);
              // L'opacité suit la certitude : la frontière apparaît en creux,
              // là où le réseau hésite encore.
              const certitude = Math.abs(a3 - 0.5) * 2;
              ctx.fillStyle = a3 >= 0.5 ? corail : bleu;
              ctx.globalAlpha = 0.05 + certitude * 0.32;
              ctx.fillRect(i * pasX, j * pasY, pasX + 1, pasY + 1);
            }
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = faible;
          ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(t(LABO.poserDesPoints, langue), largeur / 2, hChamp / 2);
          ctx.textAlign = "left";
        }

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
            const py = hChamp + 12 + (1 - v / max) * (H_COURBE - 24);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.strokeStyle = citron;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      },
    };
    // Voir la note dans `agar.tsx` : constante par instance, citée par honnêteté.
  }, [langue]);

  const pourCent = (v: number) => `${v.toLocaleString(locale(langue), { maximumFractionDigits: 0 })}${langue === "fr" ? " %" : "%"}`;

  return (
    <div>
      <Toile pilote={pilote} ratio={16 / 11} langue={langue} label={t(LABO.labelReseau, langue)} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => commander("nouvelle")}
          className={`border-2 px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
            libre
              ? "border-trait text-texte-attenue hover:border-trait-fort"
              : "bloc-citron border-citron"
          }`}
        >
          {t(LABO.autreForme, langue)}
        </button>
        <button
          type="button"
          onClick={() => commander("effacer")}
          className={`border-2 px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
            libre
              ? "bloc-citron border-citron"
              : "border-trait text-texte-attenue hover:border-trait-fort"
          }`}
        >
          {t(LABO.dessiner, langue)}
        </button>

        {libre && (
          <>
            <span className="annotation ml-2">{t(LABO.couleurPosee, langue)}</span>
            {(
              [
                [0, LABO.bleu, "bg-bleu text-sur-bleu border-bleu"],
                [1, LABO.corail, "bg-corail text-sur-corail border-corail"],
              ] as const
            ).map(([v, nom, actif]) => (
              <button
                key={nom.fr}
                type="button"
                onClick={() => choisirClasse(v)}
                aria-pressed={classe === v}
                className={`border-2 px-3 py-1.5 text-xs font-bold uppercase transition-colors ${
                  classe === v ? actif : "border-trait text-texte-attenue hover:border-trait-fort"
                }`}
              >
                {t(nom, langue)}
              </button>
            ))}
          </>
        )}
      </div>

      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {etat.forme && (
          <div className="flex gap-2">
            <dt className="annotation">{t(LABO.forme, langue)}</dt>
            <dd className="annotation text-texte">{t(LABO.formes[etat.forme], langue)}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.points, langue)}</dt>
          <dd className="annotation text-texte tabulaire">{etat.points}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.lotsVus, langue)}</dt>
          <dd className="annotation text-texte tabulaire">
            {etat.lots.toLocaleString(locale(langue))}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.perte, langue)}</dt>
          <dd className="annotation text-texte tabulaire">{etat.perte.toFixed(3)}</dd>
        </div>
        {/*
          Le plafond linéaire est posé juste avant la justesse du réseau, et pas
          ailleurs : c'est l'écart entre les deux qu'il faut pouvoir lire d'un
          seul mouvement de l'œil.
        */}
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.plafondLineaire, langue)}</dt>
          <dd className="annotation text-texte-attenue tabulaire">{pourCent(etat.plafond)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.justesse, langue)}</dt>
          <dd
            className={`annotation tabulaire ${etat.justesse >= 95 ? "text-citron" : "text-texte"}`}
          >
            {pourCent(etat.justesse)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
