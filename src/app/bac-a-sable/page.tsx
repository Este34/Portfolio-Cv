import type { Metadata } from "next";
import Link from "next/link";

import { Atelier } from "@/components/bac-a-sable/atelier";

export const metadata: Metadata = {
  title: "Bac à sable SQL",
  description:
    "Déposez un CSV ou un Parquet et interrogez-le en SQL dans votre navigateur. Aucun serveur, aucune donnée envoyée.",
};

export default function BacASable() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="grid gap-8 py-14 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        <div>
          <p className="annotation text-corail">Un outil, pas une démonstration</p>
          <h1 className="text-titre text-texte mt-2 uppercase">Vos données, votre navigateur</h1>
          <p className="text-texte-attenue mt-5 text-lg leading-relaxed">
            Déposez un fichier et interrogez-le en SQL. Un moteur analytique complet s&apos;installe
            dans l&apos;onglet, lit votre fichier depuis la mémoire, et répond sur place.
          </p>
        </div>

        <div className="border-trait-fort h-fit border-2 p-4">
          <p className="text-texte text-sm font-bold uppercase">Aucun serveur au bout</p>
          <p className="text-texte-attenue mt-2 text-sm leading-relaxed">
            Ce site est un ensemble de fichiers statiques : il n&apos;y a littéralement pas de
            machine capable de recevoir vos données. Votre fichier ne franchit jamais l&apos;onglet.
            Vous pouvez couper votre connexion après le chargement du moteur et continuer à
            travailler.
          </p>
        </div>
      </header>

      <Atelier />

      <section className="filet-fort mt-14 grid gap-8 py-12 lg:grid-cols-[1fr_2fr] lg:gap-14">
        <h2 className="text-texte h-fit text-sm font-black tracking-tight uppercase">
          Pourquoi cet outil existe
        </h2>
        <div>
          <p className="text-texte-attenue leading-relaxed">
            Analyser un fichier de plusieurs centaines de milliers de lignes se termine
            habituellement de deux façons : un tableur qui s&apos;étrangle, ou un service en ligne
            auquel il faut confier ses données. Les deux sont des mauvaises réponses quand le fichier
            est volumineux et confidentiel — ce qui est le cas courant.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            La troisième voie consiste à amener le moteur à la donnée plutôt que l&apos;inverse.
            C&apos;est le principe que j&apos;emploie dans{" "}
            <Link href="/travaux/pipeline-comtrade" className="text-corail hover:underline">
              mon analyse des flux de minéraux critiques
            </Link>{" "}
            — vingt-cinq ans de déclarations douanières interrogées sans la moindre machine à
            maintenir. Cette page est le même mécanisme, ouvert à vos fichiers.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Le moteur pèse une dizaine de méga-octets compressés, téléchargés une seule fois et
            uniquement si vous déposez quelque chose. Le reste du site ne le paie pas.
          </p>
        </div>
      </section>
    </div>
  );
}
