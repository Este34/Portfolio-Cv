"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UI } from "@/content/interface";
import { LANGUES, autreLangue, t, type Langue } from "@/lib/langue";

/**
 * Bascule de langue.
 *
 * Elle change **le premier segment de l'URL courante**, elle ne renvoie pas à
 * l'accueil. Un lecteur arrivé sur une étude de cas en français veut la même
 * étude en anglais, pas la page d'accueil : le renvoyer au départ lui fait
 * refaire tout le chemin, et c'est le défaut le plus courant des sélecteurs de
 * langue.
 *
 * Composant client parce qu'il lui faut le chemin courant, que seul le
 * navigateur connaît sur un site statique.
 */
export function BasculeLangue({ langue }: { langue: Langue }) {
  const chemin = usePathname();
  const cible = autreLangue(langue);

  /*
   * Le chemin commence par « /fr » ou « /en » dans tous les cas — le gabarit
   * racine vit sous le segment de langue. Le repli couvre malgré tout une URL
   * inattendue plutôt que de produire un lien tronqué.
   */
  const segments = chemin.split("/");
  const destination = LANGUES.includes(segments[1] as Langue)
    ? [segments[0], cible, ...segments.slice(2)].join("/")
    : `/${cible}`;

  return (
    <Link
      href={destination}
      hrefLang={cible}
      aria-label={t(UI.changerDeLangue, langue)}
      className="text-texte-faible hover:text-signal hover:border-signal border-trait rounded-instrument border px-2 py-1 transition-colors"
    >
      <span className="annotation block w-7 text-center" aria-hidden="true">
        {t(UI.changerDeLangueCourt, langue)}
      </span>
    </Link>
  );
}
