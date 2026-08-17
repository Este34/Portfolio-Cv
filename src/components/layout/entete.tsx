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
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
        <Link
          href={lien("/", langue)}
          className="group flex items-center gap-2.5 whitespace-nowrap"
          aria-label={`${SITE.nom} — ${t(UI.accueil, langue)}`}
        >
          {/* Aplat plein, pas un contour : la couleur délimite, elle ne borde pas. */}
          <span className="bloc-corail font-display px-2 py-1 text-sm leading-none font-black tracking-tight">
            EB
          </span>
          <span className="font-display text-texte hidden text-sm font-bold tracking-tight sm:inline">
            {SITE.nom}
          </span>
        </Link>

        <nav aria-label={t(UI.navigationPrincipale, langue)} className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={lien(item.href, langue)}
                  className="text-texte-attenue hover:text-corail px-2.5 py-2 text-sm font-semibold transition-colors"
                >
                  {t(item.label, langue)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sur petit écran, la console remplace la navigation : elle la contient. */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Palette langue={langue} nbPassages={nbPassages} />
          <BasculeLangue langue={langue} />
          <BasculeTheme langue={langue} />
        </div>
      </div>
    </header>
  );
}
