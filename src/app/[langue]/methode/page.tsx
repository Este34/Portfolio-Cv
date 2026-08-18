import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { PAGE_METHODE } from "@/content/pages";
import { estLangue, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/methode">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/methode",
    titre: t(PAGE_METHODE.meta.titre, langue),
    description: t(PAGE_METHODE.meta.description, langue),
  });
}

/**
 * Cette page parle à la première personne d'une pratique de travail. Le texte a
 * d'abord été écrit à partir de ce que montrent les dépôts (scripts de
 * vérification, conventions de modèle documentées, historique des commits),
 * puis relu et validé par Esteban : il l'assume.
 */
export default async function Methode({ params }: PageProps<"/[langue]/methode">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="trame" intensite={0.3} />
      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">
          {t(PAGE_METHODE.titre, langue)}
        </h1>
        <p className="text-texte-attenue mt-6 max-w-2xl text-lg leading-relaxed">
          {t(PAGE_METHODE.chapeau, langue)}
        </p>
      </header>

      <div className="grid gap-16 pb-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        {PAGE_METHODE.blocs.map((bloc) => (
          <Bloc key={bloc.titre.fr} titre={t(bloc.titre, langue)}>
            {bloc.paragraphes.map((p, i) => (
              <p
                key={p.fr.slice(0, 32)}
                className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
              >
                {t(p, langue)}
              </p>
            ))}
          </Bloc>
        ))}

        <Bloc titre={t(PAGE_METHODE.garde.titre, langue)}>
          <ul className="divide-trait divide-y">
            {PAGE_METHODE.garde.items.map((item) => (
              <li key={item.titre.fr} className="py-6 first:pt-0 last:pb-0">
                <h3 className="font-display text-texte text-lg">{t(item.titre, langue)}</h3>
                <p className="text-texte-attenue mt-2 leading-relaxed">{t(item.corps, langue)}</p>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc titre={t(PAGE_METHODE.verification.titre, langue)}>
          {PAGE_METHODE.verification.paragraphes.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
        </Bloc>

        <Bloc titre={t(PAGE_METHODE.pourquoi.titre, langue)}>
          {PAGE_METHODE.pourquoi.paragraphes.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
        </Bloc>
      </div>
    </div>
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
