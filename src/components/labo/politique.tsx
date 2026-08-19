"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { LABO } from "@/content/interface";
import { MARGE, rayon } from "@/lib/agar-regles";
import { creerAlea } from "@/lib/mlp";
import { locale, t, type Langue } from "@/lib/langue";
import {
  ACTIONS,
  DIRECTIONS,
  DT,
  EPISODES_ETALONS,
  EPISODES_EVALUATION,
  ETALONS,
  PAS_MAX,
  PAS_PAR_IMAGE,
  avancer,
  avantPolitique,
  creerMonde,
  creerEntraineur,
  meilleureAction,
  observer,
  type Entraineur,
  type Monde,
} from "@/lib/renforcement";

import { Toile, type Pilote } from "./toile";

function jeton(nom: string, repli: string) {
  if (typeof window === "undefined") return repli;
  return getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || repli;
}

/** Hauteur réservée à la courbe d'apprentissage, en pixels. */
const H_COURBE = 52;
/** Dimensions du monde, identiques à celles de l'entraînement. */
const MONDE_L = 640;
const MONDE_H = 400;

type Etat = {
  episodes: number;
  secondes: number;
  meilleure: number;
  masse: number;
  enEvaluation: boolean;
};

/**
 * Une politique qui apprend à jouer, contre la règle écrite à la main.
 *
 * ## Ce qui se passe à l'écran
 *
 * Un seul agent est montré, celui qui joue le mieux que la politique sache
 * faire à cet instant. Autour de lui, la rose des vents affiche la distribution
 * sur les huit directions : c'est **la décision**, pas son résultat. Au début
 * les huit branches sont égales, l'agent titube et se fait manger en deux
 * secondes. Après une poignée de secondes, une branche domine, et elle pointe
 * en général loin de ce qui peut l'absorber.
 *
 * L'entraînement, lui, tourne en dessous et n'est pas visible : des milliers
 * d'épisodes joués à toute vitesse pendant que celui-ci se déroule à
 * l'horloge.
 *
 * ## Les trois barres
 *
 * Elles sont la raison d'être de la démonstration, exactement comme le plafond
 * linéaire l'est pour le réseau d'à côté. « L'agent survit onze secondes » ne
 * dit rien tant qu'on ignore ce que valent le hasard et une bonne règle écrite
 * à la main sur le même problème. Les deux étalons sont mesurés hors ligne sur
 * 200 mondes et vérifiés par un test ; la politique apprise est évaluée en
 * direct sur les douze premiers de ces mêmes mondes.
 */
export function Politique({ langue }: { langue: Langue }) {
  const [etat, setEtat] = useState<Etat>({
    episodes: 0,
    secondes: 0,
    meilleure: 0,
    masse: 0,
    enEvaluation: false,
  });

  /*
   * Voir la note dans `reseau.tsx` : l'ordre passe par une référence, parce que
   * la boucle de rendu vit dans un `useMemo` monté une seule fois et ne verrait
   * jamais un état React qui change.
   */
  const canal = useRef<{ relancer: boolean }>({ relancer: false });
  const relancer = useCallback(() => {
    canal.current.relancer = true;
  }, []);

  const pilote = useMemo<Pilote>(() => {
    /*
     * Graine tirée au hasard à la première image dessinée, pas pendant le
     * rendu : `Math.random()` pendant le rendu est impur et le compilateur
     * React le refuse. Deux visites voient donc deux apprentissages
     * différents, ce qui est le propos — une politique qui converge toujours
     * de la même façon ne prouverait que la chance d'une graine.
     */
    const sim = {
      ent: null as Entraineur | null,
      vitrine: null as Monde | null,
      alea: null as (() => number) | null,
      accumulateur: 0,
      sortie: 0,
    };

    /**
     * Tout l'état mutable vit dans un objet, pas dans des variables réassignées.
     *
     * Ce n'est pas un goût : le compilateur React refuse qu'une variable
     * capturée soit réaffectée après la fin du rendu, parce qu'un rendu suivant
     * lirait alors une valeur qu'il n'a pas produite. Muter les champs d'un
     * objet créé une fois dit la même chose sans mentir sur la portée.
     */
    function demarrer() {
      const graine = Math.floor(Math.random() * 2 ** 31);
      sim.ent = creerEntraineur(graine);
      sim.alea = creerAlea(graine + 1);
      sim.vitrine = creerMonde(sim.alea, MONDE_L, MONDE_H);
    }

    return {
      auClic() {
        canal.current.relancer = true;
      },

      dessiner({ ctx, largeur, hauteur, dt }) {
        if (!sim.ent || canal.current.relancer) {
          canal.current.relancer = false;
          demarrer();
        }
        const ent = sim.ent!;

        ent.travailler(PAS_PAR_IMAGE);

        /*
         * La vitrine avance par pas de `DT`, pas au rythme de l'écran.
         *
         * La politique a été entraînée à vingt décisions par seconde. La faire
         * jouer à soixante lui donnerait trois fois plus de réactivité qu'elle
         * n'en a appris, et ce qu'on regarderait ne serait plus ce qui est
         * mesuré dans les barres.
         */
        sim.accumulateur += Math.min(dt, 0.1);
        while (sim.accumulateur >= DT) {
          sim.accumulateur -= DT;
          const m = sim.vitrine!;
          if (m.mort || m.pas >= PAS_MAX) {
            sim.sortie += DT;
            if (sim.sortie > 0.7) {
              sim.sortie = 0;
              sim.vitrine = creerMonde(sim.alea!, MONDE_L, MONDE_H);
            }
          } else {
            avancer(m, meilleureAction(avantPolitique(ent.politique, observer(m)).p));
          }
        }

        setEtat({
          episodes: ent.episodes,
          secondes: ent.mesure?.secondes ?? 0,
          meilleure: ent.meilleure,
          masse: sim.vitrine!.agent.masse,
          enEvaluation: ent.enEvaluation,
        });

        // ---- Rendu ---------------------------------------------------------
        const signal = jeton("--signal", "#ff8a3d");
        const citron = jeton("--citron", "#e8ff54");
        const corail = jeton("--corail", "#ff5a3c");
        const bleu = jeton("--bleu", "#2b4cf2");
        const trait = jeton("--trait", "#2c2c36");
        const fond = jeton("--fond-eleve", "#16161c");
        const faible = jeton("--texte-faible", "#858592");

        ctx.clearRect(0, 0, largeur, hauteur);

        const hArene = hauteur - H_COURBE;
        // Échelle uniforme : un rayon doit rester un cercle.
        const k = Math.min(largeur / MONDE_L, hArene / MONDE_H);
        const ox = (largeur - MONDE_L * k) / 2;
        const oy = (hArene - MONDE_H * k) / 2;
        const px = (x: number) => ox + x * k;
        const py = (y: number) => oy + y * k;

        const m = sim.vitrine!;

        // Cadre du monde.
        ctx.strokeStyle = trait;
        ctx.lineWidth = 1;
        ctx.strokeRect(px(0), py(0), MONDE_L * k, MONDE_H * k);

        // Granules.
        ctx.fillStyle = faible;
        ctx.globalAlpha = 0.6;
        for (const g of m.granules) {
          ctx.beginPath();
          ctx.arc(px(g.x), py(g.y), 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        /*
         * La couleur d'un rival dit ce qu'il peut faire à l'agent, pas qui il
         * est. Trois cas et non deux, avec la même marge que la règle du jeu :
         * corail s'il peut l'absorber, bleu si l'agent peut l'absorber, gris si
         * ni l'un ni l'autre. Confondre les deux derniers ferait croire à une
         * proie là où il n'y a qu'un obstacle.
         */
        for (const r of m.rivaux) {
          const teinte =
            r.masse > m.agent.masse * MARGE
              ? corail
              : m.agent.masse > r.masse * MARGE
                ? bleu
                : faible;
          ctx.beginPath();
          ctx.arc(px(r.x), py(r.y), rayon(r.masse) * k, 0, Math.PI * 2);
          ctx.fillStyle = teinte;
          ctx.globalAlpha = teinte === corail ? 0.32 : 0.15;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = teinte;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // L'agent.
        const ax = px(m.agent.x);
        const ay = py(m.agent.y);
        const ar = rayon(m.agent.masse) * k;

        if (!m.mort) {
          /*
           * La rose des vents : la décision, montrée avant son résultat.
           *
           * C'est le seul endroit du site où l'on voit ce qu'un modèle
           * *hésite* à faire. Une distribution presque plate au premier
           * épisode, une branche franche après quelques milliers.
           */
          const { p } = avantPolitique(ent.politique, observer(m));
          const choix = meilleureAction(p);
          for (let a = 0; a < ACTIONS; a++) {
            const longueur = ar + 6 + p[a] * 90 * k;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax + DIRECTIONS[a][0] * longueur, ay + DIRECTIONS[a][1] * longueur);
            ctx.strokeStyle = a === choix ? citron : faible;
            ctx.globalAlpha = a === choix ? 0.95 : 0.4;
            ctx.lineWidth = a === choix ? 2 : 1;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.arc(ax, ay, ar, 0, Math.PI * 2);
        ctx.fillStyle = m.mort ? trait : citron;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = fond;
        ctx.stroke();

        // ---- Courbe des évaluations ----------------------------------------
        ctx.strokeStyle = trait;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, hArene);
        ctx.lineTo(largeur, hArene);
        ctx.stroke();

        const haut = Math.max(ent.meilleure, ETALONS.heuristique.secondes, 1) * 1.1;
        const yDe = (v: number) => hArene + 10 + (1 - v / haut) * (H_COURBE - 20);

        // Le niveau de l'heuristique, en pointillés : la barre à franchir.
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = signal;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, yDe(ETALONS.heuristique.secondes));
        ctx.lineTo(largeur, yDe(ETALONS.heuristique.secondes));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        if (ent.historique.length > 1) {
          ctx.beginPath();
          ent.historique.forEach((v, i) => {
            const x = (i / (ent.historique.length - 1)) * largeur;
            const y = yDe(v);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.strokeStyle = citron;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      },
    };
  }, []);

  const sec = (v: number) =>
    `${v.toLocaleString(locale(langue), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;

  const haut = Math.max(etat.meilleure, ETALONS.heuristique.secondes) * 1.05;
  const barres = [
    { cle: "hasard", nom: LABO.politiqueHasard, valeur: ETALONS.hasard.secondes, teinte: "bg-trait-fort" },
    {
      cle: "heuristique",
      nom: LABO.politiqueHeuristique,
      valeur: ETALONS.heuristique.secondes,
      teinte: "bg-signal",
    },
    { cle: "apprise", nom: LABO.politiqueApprise, valeur: etat.secondes, teinte: "bg-citron" },
  ] as const;

  return (
    <div>
      <Toile pilote={pilote} ratio={16 / 11} langue={langue} label={t(LABO.labelPolitique, langue)} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={relancer}
          className="border-trait text-texte-attenue hover:border-trait-fort border-2 px-3 py-1.5 text-xs font-bold uppercase transition-colors"
        >
          {t(LABO.politiqueRelance, langue)}
        </button>
        <span className="annotation text-texte-faible normal-case">
          {t(etat.enEvaluation ? LABO.politiqueEnEvaluation : LABO.politiqueEntrainement, langue)}
        </span>
      </div>

      {/*
        Les trois barres, et la mention de ce sur quoi chacune est mesurée.
        Sans elle, on comparerait un chiffre calculé sur douze mondes à deux
        chiffres calculés sur deux cents, ce qui n'est pas la même confiance.
      */}
      <dl className="mt-4 flex flex-col gap-2">
        {barres.map((b) => (
          <div key={b.cle} className="flex items-center gap-3">
            <dt className="annotation w-28 shrink-0">{t(b.nom, langue)}</dt>
            <dd className="flex flex-1 items-center gap-3">
              <div className="bg-fond-eleve border-trait h-3 flex-1 border">
                <div
                  className={`h-full ${b.teinte}`}
                  style={{ width: `${Math.min(100, (b.valeur / haut) * 100)}%` }}
                />
              </div>
              <span className="annotation text-texte tabulaire w-14 shrink-0 text-right">
                {sec(b.valeur)}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.politiqueEpisodes, langue)}</dt>
          <dd className="annotation text-texte tabulaire">
            {etat.episodes.toLocaleString(locale(langue))}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.politiqueMeilleure, langue)}</dt>
          <dd className="annotation text-texte tabulaire">{sec(etat.meilleure)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="annotation">{t(LABO.masse, langue)}</dt>
          <dd className="annotation text-texte tabulaire">{Math.round(etat.masse)}</dd>
        </div>
      </dl>

      <p className="annotation text-texte-faible mt-2 normal-case">
        {t(LABO.politiqueProtocole, langue)
          .replace("{etalons}", String(EPISODES_ETALONS))
          .replace("{eval}", String(EPISODES_EVALUATION))}
      </p>
    </div>
  );
}
