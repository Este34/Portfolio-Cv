import { readFileSync } from "node:fs";
import { join } from "node:path";

import { locale, type Langue } from "@/lib/langue";

import { BasculeNuage } from "./bascule-nuage";
import type { PointCorpus } from "./nuage";
import type { Point3D } from "./nuage-3d";

/**
 * Section « le corpus », lue au build.
 *
 * Le fichier `embeddings-{langue}.json` pèse une vingtaine de kilo-octets,
 * essentiellement du texte intégral : l'inclure entier dans le HTML gonflerait
 * le premier rendu pour rien. On n'en garde que ce que la figure affiche —
 * coordonnées, source, lien, et un aperçu tronqué — ce qui tient en quelques
 * kilo-octets.
 *
 * Le fichier complet reste chargé à la demande par le moteur de recherche.
 */
function lireProjection(langue: Langue): {
  points: PointCorpus[];
  points3d: Point3D[];
  variance: number;
  variance3d: number;
} {
  const chemin = join(process.cwd(), "public", "data", `embeddings-${langue}.json`);
  const brut = JSON.parse(readFileSync(chemin, "utf8")) as {
    projection: { variance: number; variance3d: number };
    passages: {
      xy: [number, number];
      xyz: [number, number, number];
      source: string;
      href: string;
      texte: string;
    }[];
  };

  const apercu = (texte: string) =>
    texte.length > 190 ? `${texte.slice(0, 190).trimEnd()}…` : texte;

  return {
    variance: brut.projection.variance,
    variance3d: brut.projection.variance3d,
    points: brut.passages.map((p) => ({
      xy: p.xy,
      source: p.source,
      href: p.href,
      apercu: apercu(p.texte),
    })),
    points3d: brut.passages.map((p) => ({
      xyz: p.xyz,
      source: p.source,
      href: p.href,
      apercu: apercu(p.texte),
    })),
  };
}

/*
 * Les textes sont ici plutôt que dans `content/pages.ts` parce qu'ils
 * enchâssent des nombres mesurés au build : le compte de passages et deux parts
 * de variance. Une chaîne à trous se relit mieux à côté de ce qui la remplit.
 */
const TEXTES = {
  fr: {
    surTitre: "Le moteur de recherche, à nu",
    titre: (n: number) => `Les ${n} passages que ce site sait citer`,
    intro: (n: number) =>
      `Quand vous posez une question à ce portfolio, il compare votre phrase à ces ${n} passages. Chacun est un vecteur de 384 nombres ; les voici projetés sur un plan, colorés par source.`,
    methode:
      "La projection est une analyse en composantes principales, pas un t-SNE. C'est moins joli, les amas se chevauchent, mais c'est une ombre fidèle du nuage réel : deux points voisins ici le sont vraiment dans l'espace du modèle. Un t-SNE aurait produit des grappes nettes et des distances qui ne veulent rien dire.",
    variance: (deux: string, trois: string) => (
      <>
        Deux dimensions ne retiennent que <strong className="text-texte font-semibold">{deux} %</strong>{" "}
        de la variance. Une troisième en retient{" "}
        <strong className="text-texte font-semibold">{trois} %</strong>, et c&apos;est ce gain
        mesuré, lui seul, qui justifie la vue en volume. Cela reste peu, et c&apos;est normal :
        c&apos;est exactement pour cette raison que la recherche travaille sur les 384 dimensions, pas
        sur cette image.
      </>
    ),
  },
  en: {
    surTitre: "The search engine, laid bare",
    titre: (n: number) => `The ${n} passages this site can quote`,
    intro: (n: number) =>
      `When you ask this portfolio a question, it compares your sentence against these ${n} passages. Each one is a vector of 384 numbers; here they are projected onto a plane, coloured by source.`,
    methode:
      "The projection is a principal component analysis, not a t-SNE. It is less pretty, the clusters overlap, but it is a faithful shadow of the real cloud: two points that are neighbours here really are neighbours in the model's space. A t-SNE would have produced crisp clusters and distances that mean nothing.",
    variance: (deux: string, trois: string) => (
      <>
        Two dimensions retain only <strong className="text-texte font-semibold">{deux}%</strong> of
        the variance. A third one brings it to{" "}
        <strong className="text-texte font-semibold">{trois}%</strong>, and it is that measured gain,
        and nothing else, that justifies the volume view. It is still not much, and that is normal:
        it is exactly why the search works on all 384 dimensions and not on this picture.
      </>
    ),
  },
} as const;

export function SectionCorpus({ langue }: { langue: Langue }) {
  const { points, points3d, variance, variance3d } = lireProjection(langue);
  const textes = TEXTES[langue];
  const nombre = (v: number) => v.toLocaleString(locale(langue), { minimumFractionDigits: 1 });

  return (
    <section className="filet-fort">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="flex flex-col justify-center">
          <p className="annotation text-corail">{textes.surTitre}</p>
          <h2 className="text-titre text-texte mt-2 uppercase">{textes.titre(points.length)}</h2>

          <p className="text-texte-attenue mt-5 leading-relaxed">{textes.intro(points.length)}</p>
          <p className="text-texte-attenue mt-4 leading-relaxed">{textes.methode}</p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            {textes.variance(nombre(variance), nombre(variance3d))}
          </p>
        </div>

        <BasculeNuage
          points={points}
          points3d={points3d}
          variance={variance}
          variance3d={variance3d}
          langue={langue}
        />
      </div>
    </section>
  );
}
