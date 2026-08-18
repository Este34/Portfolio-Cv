import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { NOTES_TRIEES } from "@/content/notes";
import { PAGE_NOTES } from "@/content/pages";
import { estLangue, lien, locale, t, ts } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export async function generateMetadata({ params }: PageProps<"/[langue]/notes">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/notes",
    titre: t(PAGE_NOTES.meta.titre, langue),
    description: t(PAGE_NOTES.meta.description, langue),
  });
}

export default async function Notes({ params }: PageProps<"/[langue]/notes">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  const dateLongue = new Intl.DateTimeFormat(locale(langue), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="trame" intensite={0.32} />
      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">
          {t(PAGE_NOTES.titre, langue)}
        </h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          {t(PAGE_NOTES.chapeau, langue)}
        </p>
      </header>

      <div className="pb-20">
        {NOTES_TRIEES.map((note, i) => (
          <article key={note.slug} className="border-trait group border-t last:border-b">
            <Link
              href={lien(`/notes/${note.slug}`, langue)}
              className="block py-7 focus:outline-none"
            >
              <div className="grid gap-5 lg:grid-cols-[4.5rem_1fr] lg:gap-8">
                <span className="bloc-citron font-display tabulaire grid size-11 place-items-center text-lg leading-none font-black">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="max-w-2xl">
                  <h2 className="text-texte group-hover:text-corail text-xl uppercase transition-colors">
                    {t(note.titre, langue)}
                  </h2>
                  <p className="text-texte-attenue mt-3 leading-relaxed">{t(note.chapeau, langue)}</p>

                  <p className="annotation mt-4 flex flex-wrap gap-x-4">
                    <span>{dateLongue.format(new Date(note.date))}</span>
                    <span>{PAGE_NOTES.duree(note.minutes, langue)}</span>
                    <span className="text-texte-faible">{ts(note.sujets, langue).join(" · ")}</span>
                  </p>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
