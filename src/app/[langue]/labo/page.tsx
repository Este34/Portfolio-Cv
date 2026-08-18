import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { Agar } from "@/components/labo/agar";
import { Boids } from "@/components/labo/boids";
import { KMeans } from "@/components/labo/kmeans";
import { Reseau } from "@/components/labo/reseau";
import { UI } from "@/content/interface";
import { PAGE_LABO } from "@/content/pages";
import { estLangue, t, type Langue } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export async function generateMetadata({ params }: PageProps<"/[langue]/labo">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/labo",
    titre: t(PAGE_LABO.meta.titre, langue),
    description: t(PAGE_LABO.meta.description, langue),
  });
}

/** L'ordre d'affichage, et le composant attaché à chaque texte. */
function demonstrations(langue: Langue) {
  return [
    { id: "reseau", texte: PAGE_LABO.demos.reseau, composant: <Reseau langue={langue} /> },
    { id: "nuee", texte: PAGE_LABO.demos.nuee, composant: <Boids langue={langue} /> },
    { id: "k-moyennes", texte: PAGE_LABO.demos.kmoyennes, composant: <KMeans langue={langue} /> },
    { id: "agar", texte: PAGE_LABO.demos.agar, composant: <Agar langue={langue} /> },
  ];
}

export default async function Labo({ params }: PageProps<"/[langue]/labo">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="interference" intensite={0.34} />
      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">{t(PAGE_LABO.titre, langue)}</h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          {t(PAGE_LABO.chapeau, langue)}
        </p>
        <p className="annotation text-texte-faible mt-6 normal-case">{t(PAGE_LABO.note, langue)}</p>
      </header>

      <div className="divide-trait divide-y pb-20">
        {demonstrations(langue).map((demo, i) => (
          <section key={demo.id} id={demo.id} className="scroll-mt-20 py-14 first:pt-0">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.55fr] lg:gap-14">
              <div>
                <span className="annotation">
                  {t(UI.demonstration, langue)} {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-texte mt-2 text-2xl uppercase">
                  {t(demo.texte.titre, langue)}
                </h2>
                <p className="text-texte-attenue mt-1 text-sm">{t(demo.texte.sousTitre, langue)}</p>
                {demo.texte.corps.map((p) => (
                  <p key={p.fr.slice(0, 40)} className="text-texte-attenue mt-4 leading-relaxed">
                    {t(p, langue)}
                  </p>
                ))}
              </div>
              <div>{demo.composant}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
