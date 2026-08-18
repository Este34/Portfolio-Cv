import Link from "next/link";

import { BasculeLangue } from "@/components/bascule-langue";
import { BasculeTheme } from "@/components/bascule-theme";
import { Palette } from "@/components/console/palette";
import { construireCorpus } from "@/content/corpus";
import { UI } from "@/content/interface";
import { lien, t, type Langue } from "@/lib/langue";
import { NAV_ITEMS, SITE } from "@/lib/site";

export function Entete({ langue }: { langue: Langue }) {
  /*
   * Le compte de passages est calculé ici, côté serveur, et passé en nombre à
   * la palette. `construireCorpus` importe toute la prose du site : l'appeler
   * depuis un composant client la tirerait entière dans le lot initial pour
   * afficher un entier.
   */
  const nbPassages = construireCorpus(langue).length;

  return (
    <header className="border-trait bg-fond/85 sticky top-0 z-40 border-b backdrop-blur-md">
      {/*
        La barre est serrée : sept entrées de navigation, trois commandes, un
        nom composé. Elle tenait au pixel près sous Windows et passait déjà à la
        ligne sous Linux, dont les polices sont légèrement plus larges — « Bac à
        sable » et « Ctrl K » se coupaient en deux. Le défaut n'a été vu que par
        la comparaison des références visuelles des deux plateformes.

        Trois mesures, cumulées : la navigation complète n'apparaît qu'à partir
        de 1280 px, le nom se réduit à sa forme courte en dessous de 1536 px, et
        plus rien ne peut se couper. En dessous de 1280 px, la console prend le
        relais : elle contient déjà toute la navigation.
      */}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5">
        <Link
          href={lien("/", langue)}
          className="group flex items-center gap-2.5 whitespace-nowrap"
          aria-label={`${SITE.nom} — ${t(UI.accueil, langue)}`}
        >
          {/* Aplat plein, pas un contour : la couleur délimite, elle ne borde pas. */}
          <span className="bloc-corail font-display px-2 py-1 text-sm leading-none font-black tracking-tight">
            EB
          </span>
          <span className="font-display text-texte hidden text-sm font-bold tracking-tight sm:inline 2xl:hidden">
            {SITE.nomCourt}
          </span>
          <span className="font-display text-texte hidden text-sm font-bold tracking-tight 2xl:inline">
            {SITE.nom}
          </span>
        </Link>

        <nav aria-label={t(UI.navigationPrincipale, langue)} className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={lien(item.href, langue)}
                  className="text-texte-attenue hover:text-corail px-2 py-2 text-sm font-semibold whitespace-nowrap transition-colors"
                >
                  {t(item.label, langue)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sur petit écran, la console remplace la navigation : elle la contient. */}
        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
          <Palette langue={langue} nbPassages={nbPassages} />
          <BasculeLangue langue={langue} />
          <BasculeTheme langue={langue} />
        </div>
      </div>
    </header>
  );
}
