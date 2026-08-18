import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import { Entete } from "@/components/layout/entete";
import { Pied } from "@/components/layout/pied";
import { ThemeProvider } from "@/components/theme-provider";
import { UI } from "@/content/interface";
import { ETIQUETTE, LANGUES, estLangue, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";
import { SITE, SITE_URL, titreParDefaut } from "@/lib/site";

import "../globals.css";

/*
 * Archivo sans son axe de chasse.
 *
 * `axes: ["wdth"]` était déclaré, et aucune règle du site ne s'en sert : ni
 * `font-stretch`, ni `font-variation-settings`, nulle part. Un axe variable
 * inutilisé reste dans le fichier et se télécharge quand même. Mesuré : 54 Kio
 * de transfert sur chaque page, pour rien.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

/**
 * C'est ce gabarit, et non `app/layout.tsx`, qui est la racine du site.
 *
 * Next.js autorise une racine sous segment dynamique, et c'est la seule forme
 * qui permette de rendre `<html lang>` correctement : un lecteur d'écran
 * prononce le texte selon cet attribut, et de l'anglais annoncé avec des
 * phonèmes français est illisible à l'oreille. Une racine figée sur `lang="fr"`
 * aurait rendu la version anglaise inutilisable pour les personnes qui en ont
 * le plus besoin.
 */
export function generateStaticParams() {
  return LANGUES.map((langue) => ({ langue }));
}

export async function generateMetadata({ params }: LayoutProps<"/[langue]">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: titreParDefaut(langue),
      template: `%s — ${SITE.nom}`,
    },
    authors: [{ name: SITE.nom }],
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
    ...metadonnees({ langue, chemin: "/", description: SITE.description[langue] }),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0e12" },
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
  ],
};

export default async function GabaritRacine({ children, params }: LayoutProps<"/[langue]">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <html
      lang={ETIQUETTE[langue].html}
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="bg-fond text-texte flex min-h-full flex-col">
        {/*
          Le site est dessiné pour le sombre, mais la préférence système fait
          foi : imposer un thème à quelqu'un qui a réglé sa machine autrement
          est un choix de designer, pas un service rendu au lecteur.
        */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Cible de saut — le site reste pilotable au clavier seul. */}
          <a
            href="#contenu"
            className="bg-signal text-fond focus:ring-signal sr-only rounded-instrument px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
          >
            {t(UI.allerAuContenu, langue)}
          </a>
          <Entete langue={langue} />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Pied langue={langue} />
        </ThemeProvider>
      </body>
    </html>
  );
}
