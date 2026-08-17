"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import type { Langue } from "@/lib/langue";

/** Ne notifie jamais : l'hydratation n'arrive qu'une fois. */
const jamais = () => () => {};

const MOTS: Record<Langue, Record<string, string>> = {
  fr: {
    versClair: "Passer en mode clair",
    versSombre: "Passer en mode sombre",
    neutre: "Changer de thème",
    sombre: "sombre",
    clair: "clair",
  },
  en: {
    versClair: "Switch to light mode",
    versSombre: "Switch to dark mode",
    neutre: "Change theme",
    sombre: "dark",
    clair: "light",
  },
};

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
export function BasculeTheme({ langue }: { langue: Langue }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrate = useHydrate();

  const sombre = resolvedTheme === "dark";
  const mots = MOTS[langue];

  return (
    <button
      type="button"
      onClick={() => setTheme(sombre ? "light" : "dark")}
      aria-label={hydrate ? (sombre ? mots.versClair : mots.versSombre) : mots.neutre}
      className="text-texte-faible hover:text-signal hover:border-signal border-trait rounded-instrument border px-2 py-1 transition-colors"
    >
      <span className="annotation block w-12 text-center" aria-hidden="true">
        {hydrate ? (sombre ? mots.sombre : mots.clair) : " "}
      </span>
    </button>
  );
}
