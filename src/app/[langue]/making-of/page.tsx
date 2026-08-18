import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { UI } from "@/content/interface";
import { PAGE_MAKING_OF } from "@/content/pages";
import { estLangue, lien, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";
import { NAV_ITEMS } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/making-of">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/making-of",
    titre: t(PAGE_MAKING_OF.meta.titre, langue),
    description: t(PAGE_MAKING_OF.meta.description, langue),
  });
}

export default async function MakingOf({ params }: PageProps<"/[langue]/making-of">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  const travaux = NAV_ITEMS.find((n) => n.href === "/travaux");
  const methode = NAV_ITEMS.find((n) => n.href === "/methode");

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="flux" intensite={0.3} />
      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">
          {t(PAGE_MAKING_OF.titre, langue)}
        </h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          {t(PAGE_MAKING_OF.chapeau, langue)}
        </p>
      </header>

      <section aria-label={t(UI.mesures, langue)} className="border-trait border-y">
        <dl className="divide-trait grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
          {PAGE_MAKING_OF.mesures.map((m) => (
            <div key={m.valeur} className="border-trait border-b px-1 py-6 lg:border-b-0 lg:px-5">
              <dt className="annotation">{t(m.libelle, langue)}</dt>
              <dd className="font-display text-texte tabulaire mt-2 text-2xl uppercase">
                {m.valeur}
              </dd>
              <p className="annotation text-texte-faible mt-1.5 normal-case">{t(m.note, langue)}</p>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-16 py-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <Bloc titre={t(PAGE_MAKING_OF.principe.titre, langue)}>
          {PAGE_MAKING_OF.principe.paragraphes.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
        </Bloc>

        <Bloc titre={t(PAGE_MAKING_OF.budget.titre, langue)}>
          <p className="text-texte-attenue leading-relaxed">
            {t(PAGE_MAKING_OF.budget.chapeau, langue)}
          </p>
          <ul className="border-trait divide-trait mt-5 divide-y border-y">
            {PAGE_MAKING_OF.budget.etages.map((e) => (
              <li key={e.titre.fr} className="py-3">
                <p className="annotation">{t(e.titre, langue)}</p>
                <p className="text-texte-attenue mt-1 text-sm">{t(e.corps, langue)}</p>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc titre={t(UI.decisions, langue)}>
          <ol className="divide-trait divide-y">
            {PAGE_MAKING_OF.arbitrages.map((a, i) => (
              <li key={a.titre.fr} className="py-6 first:pt-0 last:pb-0">
                <span className="annotation">
                  {t(UI.arbitrage, langue)} {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-texte mt-2 text-lg">{t(a.titre, langue)}</h3>
                <p className="text-texte-attenue mt-2 leading-relaxed">{t(a.corps, langue)}</p>
              </li>
            ))}
          </ol>
        </Bloc>

        <Bloc titre={t(PAGE_MAKING_OF.verifie.titre, langue)}>
          {PAGE_MAKING_OF.verifie.paragraphes.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
        </Bloc>
      </div>

      <div className="border-trait border-t py-10">
        <p className="text-texte-attenue flex flex-wrap gap-x-6 gap-y-2">
          <Link href={lien("/travaux", langue)} className="text-signal hover:underline">
            {travaux && t(travaux.label, langue)} →
          </Link>
          <Link href={lien("/methode", langue)} className="text-signal hover:underline">
            {methode && t(methode.label, langue)} →
          </Link>
        </p>
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
