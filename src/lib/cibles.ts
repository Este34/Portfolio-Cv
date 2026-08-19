/**
 * Les destinations atteignables depuis la console.
 *
 * Cette liste vivait dans la palette. Elle en sort parce que l'agent doit
 * pouvoir naviguer, et qu'une navigation choisie par un modèle ne peut aller
 * **que** vers une destination déjà connue du site.
 *
 * C'est la seule garantie qui tienne : valider la forme d'un chemin ne suffit
 * pas, puisque `/fr/../..%2Failleurs` a la bonne forme. Ici, la cible proposée
 * est comparée à une liste construite depuis le contenu, et tout ce qui n'y
 * figure pas est refusé sans être interprété.
 */

import { TRAVAUX_TRIES } from "@/content/travaux";
import { lien, t, type Langue } from "./langue";
import { NAV_DISCRETE, NAV_ITEMS } from "./site";

export type Cible = { href: string; label: string; detail: string };

export function cibles(langue: Langue): Cible[] {
  return [
    ...NAV_ITEMS.map((n) => ({
      href: lien(n.href, langue),
      label: t(n.label, langue),
      detail: t(n.description, langue),
    })),
    ...NAV_DISCRETE.map((n) => ({
      href: lien(n.href, langue),
      label: t(n.label, langue),
      detail: "",
    })),
    ...TRAVAUX_TRIES.map((tr) => ({
      href: lien(`/travaux/${tr.slug}`, langue),
      label: t(tr.titre, langue),
      detail: t(tr.sousTitre, langue),
    })),
  ];
}

/**
 * Résout une cible proposée en un chemin réellement servi, ou `null`.
 *
 * Accepte un chemin exact, ou un libellé de page. Le second cas n'est pas une
 * commodité : un modèle à qui l'on décrit les pages par leur nom répond par un
 * nom, et lui demander de deviner la forme des URL produirait surtout des
 * chemins inventés.
 */
export function resoudreCible(propose: string, langue: Langue): Cible | null {
  const liste = cibles(langue);
  const brut = propose.trim();
  if (!brut) return null;

  const exact = liste.find((c) => c.href === brut || c.href === brut.replace(/\/+$/, ""));
  if (exact) return exact;

  const normalise = (v: string) =>
    v
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const cle = normalise(brut);
  return liste.find((c) => normalise(c.label) === cle || normalise(c.href) === cle) ?? null;
}
