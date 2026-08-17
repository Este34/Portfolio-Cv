import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";

import { Entete } from "@/components/layout/entete";
import { Pied } from "@/components/layout/pied";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE, SITE_URL } from "@/lib/site";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.nom} — ${SITE.fonction}`,
    template: `%s — ${SITE.nom}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.nom }],
  /*
   * « ./ » fait que chaque page se déclare canonique d'elle-même, résolue
   * contre `metadataBase`. Sans canonical, un même contenu servi sur le
   * domaine de production, sur une préproduction et sur l'URL de déploiement
   * apparaît comme trois pages distinctes et concurrentes.
   */
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE.nom,
    title: `${SITE.nom} — ${SITE.fonction}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08090a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f2ed" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
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
          {/* Cible de saut — l'instrument reste pilotable au clavier seul. */}
          <a
            href="#contenu"
            className="bg-signal text-fond focus:ring-signal sr-only rounded-instrument px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
          >
            Aller au contenu
          </a>
          <Entete />
          <main id="contenu" className="flex-1">
            {children}
          </main>
          <Pied />
        </ThemeProvider>
      </body>
    </html>
  );
}
