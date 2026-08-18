"use client";

import { useSyncExternalStore } from "react";

/** Ne notifie jamais : l'hydratation n'arrive qu'une fois. */
const jamais = () => () => {};

/**
 * `false` au rendu serveur, `true` une fois la page hydratée.
 *
 * Préféré à `useState` + `useEffect` : c'est le mécanisme prévu par React pour
 * distinguer les deux rendus, et il ne déclenche pas de rendu en cascade.
 *
 * Sert partout où le rendu serveur ne peut pas connaître la bonne valeur —
 * thème résolu, capacités du navigateur, ou vue par défaut d'une figure dont la
 * version riche a besoin de JavaScript.
 */
export function useHydrate(): boolean {
  return useSyncExternalStore(
    jamais,
    () => true,
    () => false,
  );
}
