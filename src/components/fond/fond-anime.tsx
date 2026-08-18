"use client";

import dynamic from "next/dynamic";

import type { Motif } from "./champ";

/**
 * Enveloppe le fond en shader et le sort du chemin critique.
 *
 * `ssr: false` n'est pas cosmétique : le composant n'a rien à rendre côté
 * serveur — un canvas vide — et le charger séparément garde son code hors du
 * premier lot. Un visiteur qui lit trois paragraphes ne télécharge pas de quoi
 * dessiner un champ scalaire.
 *
 * Le conteneur est en `absolute inset-0` : il n'occupe aucune place dans le
 * flux et ne peut donc pas modifier la hauteur de la section qui l'accueille.
 * Celle-ci doit porter `relative isolate overflow-hidden`, et le contenu qui
 * suit `relative`, faute de quoi le fond passerait par-dessus.
 */
const Champ = dynamic(() => import("./champ").then((m) => m.Champ), { ssr: false });

export function FondAnime({
  motif,
  intensite,
  lignes,
  className = "",
}: {
  motif?: Motif;
  intensite?: number;
  lignes?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <Champ motif={motif} intensite={intensite} lignes={lignes} />
    </div>
  );
}
