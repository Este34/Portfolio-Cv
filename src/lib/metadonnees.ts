import type { Metadata } from "next";

import { ETIQUETTE, LANGUES, LANGUE_DEFAUT, lien, type Langue } from "./langue";
import { SITE, SITE_URL } from "./site";

/**
 * Métadonnées d'une page, canonique et `hreflang` compris.
 *
 * Centralisé plutôt que recopié dans chaque page, parce que la partie qui
 * compte est aussi celle qu'on oublie : sans `hreflang`, un moteur voit deux
 * pages presque identiques sur deux URL et en choisit une, généralement pas
 * celle qu'on voulait. Avec, il sait qu'il s'agit de la même page en deux
 * langues et sert la bonne selon le lecteur.
 *
 * `x-default` pointe vers le français : c'est la langue d'origine du site et
 * celle vers laquelle la racine redirige.
 */
export function metadonnees({
  langue,
  chemin,
  titre,
  description,
}: {
  langue: Langue;
  /** Chemin sans préfixe de langue, par exemple `/travaux`. */
  chemin: string;
  /** Absent sur l'accueil, qui prend le titre par défaut du gabarit. */
  titre?: string;
  description: string;
}): Metadata {
  const url = (l: Langue) => `${SITE_URL}${lien(chemin, l)}`;

  const langues: Record<string, string> = { "x-default": url(LANGUE_DEFAUT) };
  for (const l of LANGUES) langues[ETIQUETTE[l].html] = url(l);

  return {
    ...(titre ? { title: titre } : {}),
    description,
    alternates: { canonical: url(langue), languages: langues },
    openGraph: {
      type: "website",
      url: url(langue),
      locale: ETIQUETTE[langue].og,
      siteName: SITE.nom,
      title: titre ? `${titre} — ${SITE.nom}` : `${SITE.nom} — ${SITE.fonction[langue]}`,
      description,
    },
  };
}
