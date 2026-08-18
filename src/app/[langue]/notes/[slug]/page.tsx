import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { NOTES, NOTES_TRIEES, noteParSlug, type Bloc } from "@/content/notes";
import { PAGE_NOTES } from "@/content/pages";
import { LANGUES, estLangue, lien, locale, t, ts, type Langue } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export function generateStaticParams() {
  return LANGUES.flatMap((langue) => NOTES.map((n) => ({ langue, slug: n.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/notes/[slug]">): Promise<Metadata> {
  const { langue, slug } = await params;
  const note = noteParSlug(slug);
  if (!estLangue(langue) || !note) return {};

  return metadonnees({
    langue,
    chemin: `/notes/${note.slug}`,
    titre: t(note.titre, langue),
    description: t(note.chapeau, langue),
  });
}

export default async function PageNote({ params }: PageProps<"/[langue]/notes/[slug]">) {
  const { langue, slug } = await params;
  const note = noteParSlug(slug);
  if (!estLangue(langue) || !note) notFound();

  const index = NOTES_TRIEES.findIndex((n) => n.slug === note.slug);
  /*
   * Le renvoi vers la note suivante n'existe que s'il y en a une autre.
   *
   * Le calcul modulaire fait boucler la liste, ce qui est le bon comportement à
   * partir de deux notes et un lien vers soi-même à partir d'une seule. Le
   * défaut ne se voit pas dans le code, il se voit sur la page.
   */
  const suivante = NOTES_TRIEES.length > 1 ? NOTES_TRIEES[(index + 1) % NOTES_TRIEES.length] : null;
  const date = new Intl.DateTimeFormat(locale(langue), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(note.date));

  return (
    <article className="mx-auto max-w-6xl px-5">
      <FondAnime motif="trame" intensite={0.3} />
      <header className="py-16 lg:py-20">
        <p className="annotation text-corail">{t(PAGE_NOTES.surTitre, langue)}</p>
        <h1 className="font-display text-titre text-texte mt-2 max-w-4xl uppercase">
          {t(note.titre, langue)}
        </h1>
        <p className="text-texte-attenue mt-6 max-w-2xl text-lg leading-relaxed">
          {t(note.chapeau, langue)}
        </p>
        <p className="annotation mt-6 flex flex-wrap gap-x-4">
          <span>{date}</span>
          <span>{PAGE_NOTES.duree(note.minutes, langue)}</span>
          <span className="text-texte-faible">{ts(note.sujets, langue).join(" · ")}</span>
        </p>
      </header>

      {/*
        Colonne de lecture volontairement étroite.

        Une note technique se lit en continu, contrairement au reste du site qui
        s'explore. Au-delà d'environ soixante-quinze signes par ligne, l'œil
        perd le début de la ligne suivante ; la mesure vaut pour un article et
        pas pour une fiche de projet, d'où cette largeur qu'on ne retrouve
        nulle part ailleurs.
      */}
      <div className="max-w-[68ch] pb-16">
        {note.blocs.map((bloc, i) => (
          <BlocRendu key={i} bloc={bloc} langue={langue} />
        ))}
      </div>

      {suivante && (
        <nav className="border-trait border-t py-10" aria-label={t(PAGE_NOTES.suivante, langue)}>
          <Link href={lien(`/notes/${suivante.slug}`, langue)} className="group block">
            <span className="annotation">{t(PAGE_NOTES.suivante, langue)}</span>
            <p className="font-display text-texte group-hover:text-signal mt-2 text-xl uppercase transition-colors">
              {t(suivante.titre, langue)} →
            </p>
          </Link>
        </nav>
      )}
    </article>
  );
}

function BlocRendu({ bloc, langue }: { bloc: Bloc; langue: Langue }) {
  switch (bloc.type) {
    case "titre":
      return (
        <h2 className="font-display text-texte mt-12 text-xl uppercase first:mt-0">
          {t(bloc.texte, langue)}
        </h2>
      );

    case "paragraphe":
      return <p className="text-texte-attenue mt-5 leading-relaxed">{t(bloc.texte, langue)}</p>;

    case "liste":
      return (
        <ul className="mt-5 space-y-3">
          {ts(bloc.items, langue).map((item) => (
            <li key={item} className="text-texte-attenue flex gap-3 leading-relaxed">
              <span aria-hidden="true" className="text-corail mt-3 h-px w-4 shrink-0 bg-current" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "citation":
      return (
        <blockquote className="border-corail text-texte my-8 border-l-4 pl-5 text-lg leading-relaxed font-semibold">
          {t(bloc.texte, langue)}
        </blockquote>
      );

    case "code":
      return (
        <pre className="border-trait-fort bg-fond-eleve donnee mt-6 overflow-x-auto border-2 p-4 leading-relaxed">
          <code>{t(bloc.code, langue)}</code>
        </pre>
      );
  }
}
