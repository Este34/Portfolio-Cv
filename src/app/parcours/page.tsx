import type { Metadata } from "next";

import { COMPETENCES, EXPERIENCES, FORMATION, type Etape } from "@/content/parcours";

export const metadata: Metadata = {
  title: "Parcours",
  description: "Formation, alternance et compétences d'Esteban Beretti.",
};

export default function Parcours() {
  /*
   * Les étapes incomplètes ne sont pas rendues. Tant qu'Esteban n'a pas fourni
   * son CV, la page reste courte plutôt que meublée d'approximations.
   */
  const formation = FORMATION.filter((e) => !e.aCompleter);
  const experiences = EXPERIENCES.filter((e) => !e.aCompleter);

  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="border-trait flex items-center justify-between border-b py-3">
        <span className="annotation">Index / 004</span>
        <span className="annotation">Parcours</span>
      </div>

      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte font-semibold">Parcours</h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          En alternance dans {""}
          <span className="text-texte">un institut de recherche public</span>, où je porte des
          modèles de prospective vers le web. Entrée en Master 1 IA Engineer à la rentrée 2026.
        </p>
      </header>

      <div className="grid gap-16 pb-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        {experiences.length > 0 && (
          <Bloc titre="Expérience">
            <Chronologie etapes={experiences} />
          </Bloc>
        )}

        {formation.length > 0 && (
          <Bloc titre="Formation">
            <Chronologie etapes={formation} />
          </Bloc>
        )}

        <Bloc titre="Compétences">
          <dl className="divide-trait divide-y">
            {COMPETENCES.map((groupe) => (
              <div key={groupe.famille} className="py-5 first:pt-0">
                <dt className="annotation">{groupe.famille}</dt>
                <dd className="mt-2.5">
                  <ul className="flex flex-wrap gap-x-2 gap-y-2">
                    {groupe.items.map((item) => (
                      <li
                        key={item}
                        className="border-trait text-texte-attenue rounded-instrument border px-2.5 py-1 text-sm"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </Bloc>
      </div>
    </div>
  );
}

function Chronologie({ etapes }: { etapes: readonly Etape[] }) {
  return (
    <ol className="divide-trait divide-y">
      {etapes.map((e) => (
        <li key={e.titre} className="grid gap-2 py-6 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6">
          <span className="annotation sm:pt-1">{e.periode}</span>
          <div>
            <h3 className="font-display text-texte text-lg font-semibold tracking-tight">
              {e.titre}
            </h3>
            <p className="text-texte-faible mt-0.5 text-sm">{e.lieu}</p>
            <p className="text-texte-attenue mt-2.5 leading-relaxed">{e.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="font-display text-texte h-fit text-sm font-semibold tracking-widest uppercase lg:sticky lg:top-20">
        {titre}
      </h2>
      <div className="lg:pb-4">{children}</div>
    </>
  );
}
