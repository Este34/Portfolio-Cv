import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { UI } from "@/content/interface";
import { PAGE_PARCOURS } from "@/content/pages";
import { COMPETENCES, EXPERIENCES, FORMATION, type Etape } from "@/content/parcours";
import { estLangue, lien, t, type Langue } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/parcours">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/parcours",
    titre: t(PAGE_PARCOURS.meta.titre, langue),
    description: t(PAGE_PARCOURS.meta.description, langue),
  });
}

export default async function Parcours({ params }: PageProps<"/[langue]/parcours">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="niveaux" intensite={0.34} />
      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">
          {t(PAGE_PARCOURS.titre, langue)}
        </h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          {t(PAGE_PARCOURS.chapeau, langue)}
        </p>

        {/*
          Le CV est une vue de cette page, pas un document séparé : il lit les
          mêmes fichiers. Le lien est ici parce que c'est là qu'on le cherche,
          et non dans la navigation principale, qui déborde à neuf entrées.
        */}
        <div className="mt-8">
          <Link
            href={lien("/cv", langue)}
            className="border-trait-fort text-texte hover:bloc-citron border-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors"
          >
            {t({ fr: "Le CV, imprimable", en: "The résumé, printable" }, langue)}
          </Link>
        </div>
      </header>

      <div className="grid gap-16 pb-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <Bloc titre={t(UI.experience, langue)}>
          <Chronologie etapes={EXPERIENCES} langue={langue} />
        </Bloc>

        <Bloc titre={t(UI.formation, langue)}>
          <Chronologie etapes={FORMATION} langue={langue} />
        </Bloc>

        <Bloc titre={t(UI.competences, langue)}>
          <dl className="divide-trait divide-y">
            {COMPETENCES.map((groupe) => (
              <div key={groupe.famille.fr} className="py-5 first:pt-0">
                <dt className="annotation">{t(groupe.famille, langue)}</dt>
                <dd className="mt-2.5">
                  <ul className="flex flex-wrap gap-x-2 gap-y-2">
                    {groupe.items.map((item) => (
                      <li
                        key={item.fr}
                        className="border-trait text-texte-attenue rounded-instrument border px-2.5 py-1 text-sm"
                      >
                        {t(item, langue)}
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

function Chronologie({ etapes, langue }: { etapes: readonly Etape[]; langue: Langue }) {
  return (
    <ol className="divide-trait divide-y">
      {etapes.map((e) => (
        <li
          key={e.titre.fr}
          className="grid gap-2 py-6 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6"
        >
          <span className="annotation sm:pt-1">{t(e.periode, langue)}</span>
          <div>
            <h3 className="font-display text-texte text-lg">{t(e.titre, langue)}</h3>
            <p className="text-texte-faible mt-0.5 text-sm">{t(e.lieu, langue)}</p>
            <p className="text-texte-attenue mt-2.5 leading-relaxed">{t(e.description, langue)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <>
      {/*
        Le titre est enveloppé, et ce n'est pas de la décoration de balisage.

        La zone dans laquelle un élément collant reste coincé est le bloc de son
        **parent**. Sans cette enveloppe, le parent est la grille entière : les
        quatre titres se collaient alors tous à la même hauteur et finissaient
        empilés les uns sur les autres au défilement. Avec elle, chaque titre est
        borné par sa propre rangée, ce qui est le comportement qu'on lisait dans
        le code sans qu'il soit écrit.

        Le défaut a été trouvé en photographiant une page à mi-course, pas en
        relisant : il n'existe qu'entre deux positions de défilement.
      */}
      <div>
        <h2 className="font-display text-texte h-fit text-sm font-black tracking-tight uppercase lg:sticky lg:top-20">
          {titre}
        </h2>
      </div>
      <div className="lg:pb-4">{children}</div>
    </>
  );
}
