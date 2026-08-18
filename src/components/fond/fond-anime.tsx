"use client";

import dynamic from "next/dynamic";

import type { Motif } from "./champ";

/**
 * Fond de page, fixé à la fenêtre.
 *
 * ## Pourquoi fixe et non absolu
 *
 * Un fond posé derrière le seul bandeau de tête disparaissait au premier
 * défilement, et le reste de la page redevenait un aplat. Un fond aussi haut
 * que la page, lui, imposerait un canvas de plusieurs milliers de pixels de
 * haut, entièrement redessiné à chaque image alors que le visiteur n'en voit
 * qu'une fenêtre.
 *
 * `fixed` résout les deux : le canvas fait toujours exactement la taille de la
 * fenêtre, et le motif dérive sous le contenu au lieu de défiler avec lui. La
 * dérive vient de l'uniforme de défilement, qui déplace les deux couches à des
 * vitesses différentes — c'est là, et nulle part ailleurs, que se fabrique la
 * sensation de profondeur.
 *
 * ## Ce qu'il faut savoir avant d'en poser un ailleurs
 *
 * `-z-10` le place derrière tout le contenu de la page sans toucher au fond de
 * `body`, qui reste opaque. Aucun ancêtre ne doit porter `transform`, `filter`
 * ni `contain` : ces propriétés créent un bloc conteneur pour les éléments
 * fixés, et le fond se retrouverait piégé dans une section.
 *
 * `ssr: false` n'est pas cosmétique : le composant n'a rien à rendre côté
 * serveur — un canvas vide — et le charger séparément garde son code hors du
 * premier lot.
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
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
    >
      <Champ motif={motif} intensite={intensite} lignes={lignes} />
    </div>
  );
}
