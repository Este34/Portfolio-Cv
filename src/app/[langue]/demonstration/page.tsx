import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { UI } from "@/content/interface";
import { PAGE_DEMONSTRATION } from "@/content/pages";
import { estLangue, lien, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

const CHEMIN = "/demos/simulateur-numerique/index.html";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/demonstration">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/demonstration",
    titre: t(PAGE_DEMONSTRATION.meta.titre, langue),
    description: t(PAGE_DEMONSTRATION.meta.description, langue),
  });
}

export default async function Demonstration({ params }: PageProps<"/[langue]/demonstration">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="relative isolate grid gap-8 py-14 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        {/* Débordement en pleine largeur : voir la découpe horizontale dans globals.css. */}
        <FondAnime motif="interference" intensite={0.32} className="left-1/2 -z-10 w-screen -translate-x-1/2" />
        <div>
          <p className="annotation text-corail">{t(PAGE_DEMONSTRATION.surTitre, langue)}</p>
          <h1 className="text-titre text-texte mt-2 uppercase">
            {t(PAGE_DEMONSTRATION.titre, langue)}
          </h1>
          <p className="text-texte-attenue mt-5 text-lg leading-relaxed">
            {t(PAGE_DEMONSTRATION.chapeau, langue)}
          </p>
          <p className="mt-4">
            <Link
              href={lien("/travaux/suite-simulateurs-prospective", langue)}
              className="text-corail text-sm font-semibold hover:underline"
            >
              {t(UI.lireLetude, langue)} →
            </Link>
          </p>
        </div>

        <div className="border-corail bg-signal-voile h-fit border-2 p-4">
          <p className="text-corail text-sm font-bold uppercase">
            {t(PAGE_DEMONSTRATION.avertissementTitre, langue)}
          </p>
          <p className="text-texte-attenue mt-2 text-sm leading-relaxed">
            {t(PAGE_DEMONSTRATION.avertissement, langue)}
          </p>
        </div>
      </header>

      <div className="border-trait-fort border-2">
        <div className="border-trait flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
          <span className="annotation">{t(PAGE_DEMONSTRATION.donneesDemo, langue)}</span>
          <a
            href={CHEMIN}
            target="_blank"
            rel="noreferrer"
            className="text-corail text-xs font-bold uppercase hover:underline"
          >
            {t(PAGE_DEMONSTRATION.ouvrirPleinePage, langue)}
          </a>
        </div>
        {/*
          Le simulateur est une application statique autonome, servie telle
          quelle. L'iframe est ici le bon outil et non un pis-aller : elle isole
          ses feuilles de style et son espace de noms JavaScript de ceux du
          portfolio, qui n'ont rien à voir. Le chargement est différé — deux
          méga-octets de données ne doivent pas partir avant que la section soit
          atteinte.

          Le simulateur lui-même reste en français : c'est le livrable
          d'origine, et le retraduire produirait une capture d'écran d'un
          logiciel qui n'existe pas.
        */}
        <iframe
          src={CHEMIN}
          title={t(PAGE_DEMONSTRATION.titreIframe, langue)}
          loading="lazy"
          lang="fr"
          className="block h-[46rem] w-full border-0 bg-white"
        />
      </div>

      <section className="filet-fort mt-14 grid gap-8 py-12 lg:grid-cols-[1fr_2fr] lg:gap-14">
        <h2 className="text-texte h-fit text-sm font-black tracking-tight uppercase">
          {t(PAGE_DEMONSTRATION.commentTitre, langue)}
        </h2>
        <div>
          {PAGE_DEMONSTRATION.comment.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
