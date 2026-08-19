"use client";

import { useCallback, useRef, useState } from "react";

import { creerPartitionneur, meilleureGraine, representants } from "@/lib/partition";
import type { Langue } from "@/lib/langue";

/** Groupes cherchés. Voir la note sur le choix de `k` dans `bascule-nuage`. */
export const K = 5;
/** Amorçages essayés avant de retenir le meilleur. Voir `meilleureGraine`. */
export const ESSAIS = 8;
/** Plafond, au cas où une partition oscillerait entre deux états. */
const MAX_ITERATIONS = 30;
/**
 * Attente entre deux itérations, en millisecondes.
 *
 * Le calcul prend moins d'une milliseconde sur cinquante-cinq vecteurs : sans
 * cette pause, la partition serait finie avant le premier rendu et on ne
 * verrait qu'un résultat. Le même parti pris que la démonstration de
 * k-moyennes du labo, qui existe pour montrer une convergence et pas un
 * classement.
 */
const PAUSE_MS = 550;

export type EtatPartition =
  | { phase: "inactif" }
  | { phase: "chargement" }
  | {
      phase: "encours" | "fini";
      /** Étiquette de groupe de chaque passage, dans l'ordre des points. */
      etiquettes: string[];
      /** Groupes peuplés, dans l'ordre d'affichage. */
      legende: { nom: string; taille: number }[];
      iterations: number;
      inertie: number;
    }
  | { phase: "echec"; message: string };

/**
 * Charge les vraies coordonnées et fait converger la partition, pas à pas.
 *
 * Le fichier de vecteurs pèse quatre-vingt-trois kilo-octets et **ne demande
 * aucun modèle** : c'est ce qui rend cette démonstration presque gratuite, là
 * où la recherche par question doit d'abord télécharger de quoi vectoriser la
 * question. Rien n'est chargé tant que le visiteur n'a pas demandé.
 */
export function usePartition(langue: Langue, sources: readonly string[]) {
  const [etat, setEtat] = useState<EtatPartition>({ phase: "inactif" });
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arreter = useCallback(() => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    setEtat({ phase: "inactif" });
  }, []);

  const demarrer = useCallback(async () => {
    setEtat({ phase: "chargement" });
    try {
      const reponse = await fetch(`/data/embeddings-${langue}.bin`);
      if (!reponse.ok) throw new Error(`vecteurs indisponibles (${reponse.status})`);
      const vecteurs = new Float32Array(await reponse.arrayBuffer());

      const n = sources.length;
      const d = vecteurs.length / n;
      if (!Number.isInteger(d)) throw new Error("vecteurs incohérents avec la figure");

      /*
       * Huit amorçages, on garde le meilleur, puis on rejoue le gagnant.
       *
       * k-moyennes++ réduit les mauvaises initialisations, il ne les supprime
       * pas : mesuré sur des amas parfaitement séparés, une graine sur dix
       * converge vers une partition cinquante-huit fois pire en inertie, où
       * deux groupes fusionnent et un troisième se scinde. Rien ne le
       * signalerait à l'écran, et un visiteur malchanceux verrait une figure
       * qui a l'air d'un résultat.
       *
       * Les huit essais coûtent moins de dix millisecondes ; seul le gagnant
       * est ensuite rejoué pas à pas, pour que ce qui s'affiche soit une
       * convergence réelle et non un montage.
       *
       * Le tirage reste aléatoire à chaque demande. Deux visites ne voient donc
       * pas exactement les mêmes groupes, ce qui est la propriété honnête de
       * l'algorithme plutôt qu'une jolie figure figée.
       */
      const depart = Math.floor(Math.random() * 2 ** 31);
      const { graine } = meilleureGraine(
        vecteurs,
        n,
        d,
        K,
        Array.from({ length: ESSAIS }, (_, i) => depart + i * 7919),
      );
      const partition = creerPartitionneur(vecteurs, n, d, K, graine);

      const pas = () => {
        partition.avancer();
        const reps = representants(
          vecteurs,
          partition.affectations,
          partition.centres,
          n,
          d,
          K,
        );

        const tailles = new Array<number>(K).fill(0);
        for (const c of partition.affectations) tailles[c]++;

        // Le numéro préfixe le nom : deux groupes pourraient avoir un
        // représentant de la même source, et deux entrées identiques dans une
        // légende ne renseignent plus.
        const nom = (c: number) =>
          reps[c] >= 0 ? `${c + 1} · ${sources[reps[c]]}` : `${c + 1}`;

        setEtat({
          phase: partition.converge || partition.iterations >= MAX_ITERATIONS ? "fini" : "encours",
          etiquettes: [...partition.affectations].map(nom),
          legende: Array.from({ length: K }, (_, c) => ({ nom: nom(c), taille: tailles[c] })).filter(
            (g) => g.taille > 0,
          ),
          iterations: partition.iterations,
          inertie: partition.inertie,
        });

        if (!partition.converge && partition.iterations < MAX_ITERATIONS) {
          minuteur.current = setTimeout(pas, PAUSE_MS);
        }
      };

      pas();
    } catch (e: unknown) {
      setEtat({ phase: "echec", message: e instanceof Error ? e.message : "échec" });
    }
  }, [langue, sources]);

  return { etat, demarrer, arreter };
}
