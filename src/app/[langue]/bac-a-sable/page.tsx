import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { Atelier } from "@/components/bac-a-sable/atelier";
import { PAGE_BAC_A_SABLE } from "@/content/pages";
import { estLangue, lien, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/bac-a-sable">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/bac-a-sable",
    titre: t(PAGE_BAC_A_SABLE.meta.titre, langue),
    description: t(PAGE_BAC_A_SABLE.meta.description, langue),
  });
}

export default async function BacASable({ params }: PageProps<"/[langue]/bac-a-sable">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="trame" intensite={0.34} />
      <header className="grid gap-8 py-14 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        <div>
          <p className="annotation text-corail">{t(PAGE_BAC_A_SABLE.surTitre, langue)}</p>
          <h1 className="text-titre text-texte mt-2 uppercase">
            {t(PAGE_BAC_A_SABLE.titre, langue)}
          </h1>
          <p className="text-texte-attenue mt-5 text-lg leading-relaxed">
            {t(PAGE_BAC_A_SABLE.chapeau, langue)}
          </p>
        </div>

        <div className="border-trait-fort h-fit border-2 p-4">
          <p className="text-texte text-sm font-bold uppercase">
            {t(PAGE_BAC_A_SABLE.garantieTitre, langue)}
          </p>
          <p className="text-texte-attenue mt-2 text-sm leading-relaxed">
            {t(PAGE_BAC_A_SABLE.garantie, langue)}
          </p>
        </div>
      </header>

      <Atelier langue={langue} />

      <section className="filet-fort mt-14 grid gap-8 py-12 lg:grid-cols-[1fr_2fr] lg:gap-14">
        <h2 className="text-texte h-fit text-sm font-black tracking-tight uppercase">
          {t(PAGE_BAC_A_SABLE.pourquoiTitre, langue)}
        </h2>
        <div>
          {PAGE_BAC_A_SABLE.pourquoi.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
          <p className="mt-4">
            <Link
              href={lien("/travaux/pipeline-comtrade", langue)}
              className="text-corail text-sm font-semibold hover:underline"
            >
              {t(PAGE_BAC_A_SABLE.lienComtrade, langue)} →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
