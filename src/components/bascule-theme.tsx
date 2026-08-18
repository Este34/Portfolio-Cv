"use client";

import { useTheme } from "next-themes";

import { useHydrate } from "@/lib/hydrate";
import type { Langue } from "@/lib/langue";

const MOTS: Record<Langue, Record<string, string>> = {
  fr: {
    versClair: "Thème sombre. Passer en mode clair.",
    versSombre: "Thème clair. Passer en mode sombre.",
    neutre: "Changer de thème",
    sombre: "sombre",
    clair: "clair",
  },
  en: {
    versClair: "Dark theme. Switch to light mode.",
    versSombre: "Light theme. Switch to dark mode.",
    neutre: "Change theme",
    sombre: "dark",
    clair: "light",
  },
};

/**
 * Bascule sombre / clair.
 *
 * Le libellé accessible **contient** le mot affiché sur le bouton — « thème
 * sombre » quand on lit « sombre ». Sans cette précaution, le nom accessible
 * et le texte visible divergent, ce qui met en échec la commande vocale :
 * quelqu'un prononce le mot qu'il voit, et rien ne se déclenche.
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
