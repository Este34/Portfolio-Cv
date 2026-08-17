"use client";

import dynamic from "next/dynamic";

/**
 * Enveloppe le fond en shader et le sort du chemin critique.
 *
 * `ssr: false` n'est pas cosmétique : le composant n'a rien à rendre côté
 * serveur — un canvas vide — et le charger séparément garde son code hors du
 * premier lot. Un visiteur qui lit trois paragraphes ne télécharge pas de quoi
 * dessiner un champ scalaire.
 */
const Champ = dynamic(() => import("./champ-de-niveaux").then((m) => m.ChampDeNiveaux), {
  ssr: false,
});

export function FondAnime({
  intensite,
  lignes,
  className = "",
}: {
  intensite?: number;
  lignes?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <Champ intensite={intensite} lignes={lignes} />
    </div>
  );
}
