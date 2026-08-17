import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Simulateur en démonstration",
  description:
    "Une version publiable de l'un des simulateurs de prospective que j'ai construits : code et interface d'origine, données entièrement fabriquées.",
};

const CHEMIN = "/demos/simulateur-numerique/index.html";

export default function Demonstration() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="grid gap-8 py-14 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
        <div>
          <p className="annotation text-corail">Essayez-le, ne me croyez pas sur parole</p>
          <h1 className="text-titre text-texte mt-2 uppercase">Un simulateur, en vrai</h1>
          <p className="text-texte-attenue mt-5 text-lg leading-relaxed">
            Voici l&apos;un des quatre simulateurs de prospective décrits dans mes{" "}
            <Link href="/travaux/suite-simulateurs-prospective" className="text-corail hover:underline">
              travaux
            </Link>
            , dans une version publiable. Sept onglets, cinq trajectoires, trente et une matières
            suivies de 2025 à 2050 — et un mode libre où vous réglez vous-même les paramètres.
          </p>
        </div>

        <div className="border-corail bg-signal-voile h-fit border-2 p-4">
          <p className="text-corail text-sm font-bold uppercase">Les chiffres sont inventés</p>
          <p className="text-texte-attenue mt-2 text-sm leading-relaxed">
            Le code, la mise en page, les graphiques et la chaîne de calcul sont ceux que j&apos;ai
            écrits. <strong className="text-texte font-semibold">Les données, non.</strong> Toutes
            les valeurs numériques ont été régénérées par un modèle de synthèse : les courbes sont
            plausibles, elles ne modélisent rien. Les sorties réelles appartiennent à mon
            employeur et ne sont pas publiables.
          </p>
        </div>
      </header>

      <div className="border-trait-fort border-2">
        <div className="border-trait flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
          <span className="annotation">Données de démonstration</span>
          <a
            href={CHEMIN}
            target="_blank"
            rel="noreferrer"
            className="text-corail text-xs font-bold uppercase hover:underline"
          >
            Ouvrir en pleine page ↗
          </a>
        </div>
        {/*
          Le simulateur est une application statique autonome, servie telle
          quelle. L'iframe est ici le bon outil et non un pis-aller : elle isole
          ses feuilles de style et son espace de noms JavaScript de ceux du
          portfolio, qui n'ont rien à voir. Le chargement est différé — deux
          méga-octets de données ne doivent pas partir avant que la section soit
          atteinte.
        */}
        <iframe
          src={CHEMIN}
          title="Simulateur de prospective numérique, en données de démonstration"
          loading="lazy"
          className="block h-[46rem] w-full border-0 bg-white"
        />
      </div>

      <section className="filet-fort mt-14 grid gap-8 py-12 lg:grid-cols-[1fr_2fr] lg:gap-14">
        <h2 className="text-texte h-fit text-sm font-black tracking-tight uppercase">
          Comment cette version a été produite
        </h2>
        <div>
          <p className="text-texte-attenue leading-relaxed">
            Un script de neutralisation lit le dépôt privé et écrit cette version. Il conserve le
            code, les feuilles de style, les bibliothèques et les clés de structure — «&nbsp;Aluminium
            », «&nbsp;Smartphones&nbsp;», «&nbsp;Stock&nbsp;» sont du vocabulaire public, pas une
            information appartenant à quelqu&apos;un.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Il remplace en revanche l&apos;intégralité des valeurs numériques, les noms de
            trajectoires, les territoires, les logos, les cartes, ainsi que la police et les
            couleurs du design system imposé — ce dernier étant à lui seul un indice
            d&apos;appartenance.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Quatre défauts n&apos;ont été trouvés qu&apos;en ouvrant le résultat dans un
            navigateur : une règle de substitution mal ordonnée qui renommait un fichier sans
            renommer sa référence, laissant l&apos;application réclamer un script inexistant ; un
            bloc-marque institutionnel encore affiché, qu&apos;aucune substitution de chaîne ne
            pouvait retirer ; des polices renommées vers des fichiers absents ; et des images
            pointant sur un dossier vide. C&apos;est la raison pour laquelle la vérification passe
            par un navigateur réel et non par une relecture.
          </p>
        </div>
      </section>
    </div>
  );
}
