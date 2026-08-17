import { ImageResponse } from "next/og";

import { LANGUES, LANGUE_DEFAUT, estLangue } from "@/lib/langue";
import { SITE } from "@/lib/site";

/**
 * Vignette de partage, générée au build, dans chaque langue.
 *
 * Reprend le geste central de la direction « Signal » : trois aplats de couleur
 * pleine portant les chiffres, et un titre en graisse noire très serrée. Une
 * vignette qui ne ressemble pas au site qu'elle annonce est une promesse rompue
 * avant même le clic.
 */

export const alt = SITE.nom;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return LANGUES.map((langue) => ({ langue }));
}

const NOIR = "#0E0E12";
const BLANC = "#F5F3EF";
const BLEU = "#2B4CF2";
const CORAIL = "#FF5A3C";
const CITRON = "#E8FF54";
const GRIS = "#8C8C99";

const NOIRE = "Archivo Black";

const TEXTES = {
  fr: {
    sousTitre: "Une base SQL et un modèle de recherche tournent dans la page.",
    chiffres: [
      ["0,00002 %", "écart au modèle"],
      ["4", "modèles portés"],
      ["240", "pays analysés"],
    ],
  },
  en: {
    sousTitre: "A SQL engine and a search model run inside the page.",
    chiffres: [
      ["0.00002%", "drift from the model"],
      ["4", "models ported"],
      ["240", "countries analysed"],
    ],
  },
} as const;

/**
 * Récupère Archivo Black au build, pour la passer au générateur d'image.
 *
 * **Pourquoi c'est nécessaire.** Le générateur ne connaît que sa police par
 * défaut, dans une seule graisse : déclarer « Arial Black » ou `fontWeight:
 * 900` n'a aucun effet, il retombe silencieusement sur du romain. Or cette
 * direction repose entièrement sur la masse typographique — une vignette en
 * graisse normale annonce un autre site que celui qu'on va ouvrir.
 *
 * **Pourquoi c'est enveloppé.** Deux appels réseau pendant un build, c'est deux
 * occasions d'échouer pour une raison qui n'a rien à voir avec le code. En cas
 * de problème on renvoie `null` et l'image se rend avec la police par défaut :
 * moins belle, mais le déploiement passe. Une vignette n'est pas un motif
 * suffisant pour bloquer une mise en production.
 */
async function chargerPolice(): Promise<ArrayBuffer | null> {
  try {
    /*
     * Aucun en-tête `User-Agent` : c'est volontaire, et c'est le point qui
     * m'avait échappé. Google adapte le format servi au navigateur qui
     * demande — à un agent moderne il renvoie du WOFF2, que le générateur
     * d'image ne sait pas décoder, et la police était donc silencieusement
     * ignorée. Sans en-tête, il sert du TTF, qui se lit.
     */
    const css = await fetch("https://fonts.googleapis.com/css2?family=Archivo+Black").then((r) =>
      r.text(),
    );

    const url = css.match(/src:\s*url\((https:[^)]+\.(?:ttf|otf))\)/)?.[1];
    if (!url) return null;

    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ langue: string }> }) {
  const { langue: brute } = await params;
  const langue = estLangue(brute) ? brute : LANGUE_DEFAUT;
  const textes = TEXTES[langue];

  const police = await chargerPolice();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: NOIR,
          fontFamily: "sans-serif",
        }}
      >
        {/* Bandeau supérieur en aplat citron — le geste le plus reconnaissable. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: CITRON,
            color: NOIR,
            padding: "18px 56px",
          }}
        >
          <div style={{ display: "flex", fontFamily: NOIRE, fontSize: 26, letterSpacing: -1 }}>
            {SITE.nom.toUpperCase()}
          </div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 21, fontWeight: 700 }}>
            {SITE.fonction[langue]}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "0 56px",
          }}
        >
          <div
            style={{
              display: "flex",
              color: BLANC,
              fontFamily: NOIRE,
              fontSize: 82,
              lineHeight: 0.92,
              letterSpacing: -3.5,
              textTransform: "uppercase",
              maxWidth: 1010,
            }}
          >
            {SITE.accroche[langue].replace(/\.$/, "")}
          </div>

          <div style={{ display: "flex", marginTop: 30, color: GRIS, fontSize: 24, maxWidth: 860 }}>
            {textes.sousTitre}
          </div>
        </div>

        {/* Les chiffres en aplats pleins, bord à bord, sur toute la largeur. */}
        <div style={{ display: "flex" }}>
          {textes.chiffres.map(([valeur, libelle], i) => {
            const [fond, encre] = [
              [BLEU, BLANC],
              [CORAIL, NOIR],
              [CITRON, NOIR],
            ][i];
            return (
              <div
                key={libelle}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  flex: 1,
                  background: fond,
                  color: encre,
                  padding: "22px 56px",
                }}
              >
                <div
                  style={{ display: "flex", fontFamily: NOIRE, fontSize: 42, letterSpacing: -1.5 }}
                >
                  {valeur}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    opacity: 0.82,
                  }}
                >
                  {libelle}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: police
        ? [{ name: NOIRE, data: police, style: "normal" as const, weight: 400 as const }]
        : undefined,
    },
  );
}
