import type { Metadata } from "next";

import { CarteTravail } from "@/components/carte-travail";
import { TRAVAUX_TRIES, stackAgregee } from "@/content/travaux";

export const metadata: Metadata = {
  title: "Travaux",
  description:
    "Simulateurs de prospective portés d'Excel vers le navigateur, pipelines de données à grande échelle et systèmes de recherche augmentée.",
};

export default function Travaux() {
  const stack = stackAgregee();

  return (
    <div className="mx-auto max-w-6xl px-5">
          <div className="border-trait flex items-center justify-between border-b py-3">
            <span className="annotation">Index / 002</span>
            <span className="annotation">{TRAVAUX_TRIES.length} entrées</span>
          </div>

          <header className="py-16 lg:py-20">
            <h1 className="font-display text-titre text-texte font-semibold">Travaux</h1>
            <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
              Quatre chantiers, un même geste : prendre un modèle enfermé dans un outil que peu de
              gens peuvent ouvrir, et le rendre manipulable par tous — sans perdre en fidélité.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2" aria-label="Technologies employées">
              {stack.slice(0, 14).map((s) => (
                <li key={s.nom} className="annotation text-texte-faible">
                  {s.nom}
                  {s.occurrences > 1 && <span className="text-signal ml-1">×{s.occurrences}</span>}
                </li>
              ))}
            </ul>
          </header>

          <section className="pb-20">
            {TRAVAUX_TRIES.map((travail, i) => (
              <CarteTravail key={travail.slug} travail={travail} index={i} />
            ))}
      </section>
    </div>
  );
}
