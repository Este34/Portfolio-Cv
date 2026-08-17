import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NuageCorpus, type PointCorpus } from "./nuage";

/**
 * Section « le corpus », lue au build.
 *
 * Le fichier `embeddings.json` pèse 22 Kio, essentiellement du texte intégral :
 * l'inclure entier dans le HTML gonflerait le premier rendu pour rien. On n'en
 * garde que ce que la figure affiche — coordonnées, source, lien, et un aperçu
 * tronqué — ce qui tient en quelques kilo-octets.
 *
 * Le fichier complet reste chargé à la demande par le moteur de recherche.
 */
function lireProjection(): { points: PointCorpus[]; variance: number } {
  const chemin = join(process.cwd(), "public", "data", "embeddings.json");
  const brut = JSON.parse(readFileSync(chemin, "utf8")) as {
    projection: { variance: number };
    passages: { xy: [number, number]; source: string; href: string; texte: string }[];
  };

  return {
    variance: brut.projection.variance,
    points: brut.passages.map((p) => ({
      xy: p.xy,
      source: p.source,
      href: p.href,
      apercu: p.texte.length > 190 ? `${p.texte.slice(0, 190).trimEnd()}…` : p.texte,
    })),
  };
}

export function SectionCorpus() {
  const { points, variance } = lireProjection();

  return (
    <section className="filet-fort">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div className="flex flex-col justify-center">
          <p className="annotation text-corail">Le moteur de recherche, à nu</p>
          <h2 className="text-titre text-texte mt-2 uppercase">
            Les {points.length} passages que ce site sait citer
          </h2>

          <p className="text-texte-attenue mt-5 leading-relaxed">
            Quand vous posez une question à ce portfolio, il compare votre phrase à ces{" "}
            {points.length} passages. Chacun est un vecteur de 384 nombres ; les voici projetés sur
            un plan, colorés par source.
          </p>

          <p className="text-texte-attenue mt-4 leading-relaxed">
            La projection est une analyse en composantes principales, pas un t-SNE. C&apos;est moins
            joli — les amas se chevauchent — mais c&apos;est une ombre fidèle du nuage réel : deux
            points voisins ici le sont vraiment dans l&apos;espace du modèle. Un t-SNE aurait produit
            des grappes nettes et des distances qui ne veulent rien dire.
          </p>

          <p className="text-texte-attenue mt-4 leading-relaxed">
            Deux dimensions ne retiennent que{" "}
            <strong className="text-texte font-semibold">{variance} %</strong> de la variance. C&apos;est
            peu, et c&apos;est normal : c&apos;est exactement pour cette raison que la recherche
            travaille sur les 384, pas sur cette image.
          </p>
        </div>

        <NuageCorpus points={points} variance={variance} />
      </div>
    </section>
  );
}
