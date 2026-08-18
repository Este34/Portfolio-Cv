import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { CarteTravail } from "@/components/carte-travail";
import { UI } from "@/content/interface";
import { PAGE_TRAVAUX } from "@/content/pages";
import { TRAVAUX_TRIES, stackAgregee } from "@/content/travaux";
import { estLangue, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/travaux">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/travaux",
    titre: t(PAGE_TRAVAUX.meta.titre, langue),
    description: t(PAGE_TRAVAUX.meta.description, langue),
  });
}

export default async function Travaux({ params }: PageProps<"/[langue]/travaux">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  const stack = stackAgregee(langue);

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="flux" intensite={0.34} />
      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">
          {t(PAGE_TRAVAUX.titre, langue)}
        </h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          {t(PAGE_TRAVAUX.chapeau, langue)}
        </p>

        <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2" aria-label={t(UI.technologiesEmployees, langue)}>
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
          <CarteTravail key={travail.slug} travail={travail} index={i} langue={langue} />
        ))}
      </section>
    </div>
  );
}
