"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

/** Ne notifie jamais : l'hydratation n'arrive qu'une fois. */
const jamais = () => () => {};

/**
 * `false` au rendu serveur, `true` une fois hydraté.
 *
 * Préféré à `useState` + `useEffect` : c'est le mécanisme prévu par React pour
 * distinguer les deux rendus, et il ne déclenche pas de rendu en cascade.
 */
function useHydrate() {
  return useSyncExternalStore(
    jamais,
    () => true,
    () => false,
  );
}

/**
 * Bascule sombre / clair.
 *
 * Le thème résolu n'existe pas au rendu serveur. Tout ce qui en dépend —
 * libellé visible **et** `aria-label` — reste donc neutre tant que la page
 * n'est pas hydratée, sinon React signale un décalage et renonce à corriger
 * l'attribut : le bouton mentirait alors aux lecteurs d'écran pour le reste
 * de la session.
 */
export function BasculeTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrate = useHydrate();

  const sombre = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(sombre ? "light" : "dark")}
      aria-label={
        hydrate ? (sombre ? "Passer en mode clair" : "Passer en mode sombre") : "Changer de thème"
      }
      className="text-texte-faible hover:text-signal hover:border-signal border-trait rounded-instrument border px-2 py-1 transition-colors"
    >
      <span className="annotation block w-14 text-center" aria-hidden="true">
        {hydrate ? (sombre ? "sombre" : "clair") : " "}
      </span>
    </button>
  );
}
