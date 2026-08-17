import { ImageResponse } from "next/og";

import { SITE } from "@/lib/site";

/**
 * Vignette de partage, générée au build.
 *
 * Reprend le vocabulaire visuel du site — encre, blanc os, un signal ambre,
 * annotations en monospace — parce qu'une vignette qui ne ressemble pas au site
 * qu'elle annonce est une promesse rompue avant même le clic.
 *
 * Polices système volontairement : charger une police distante ici ajouterait
 * un appel réseau au build pour un gain invisible à cette taille.
 */

export const alt = `${SITE.nom} — ${SITE.fonction}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ENCRE = "#08090A";
const OS = "#EDEAE4";
const SIGNAL = "#FF8A3D";
const ATTENUE = "#8A9299";
const TRAIT = "#23282D";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: ENCRE,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Bandeau d'annotation, comme en tête de chaque page du site. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${TRAIT}`,
            paddingBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                border: `1px solid ${SIGNAL}`,
                color: SIGNAL,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 4,
                padding: "6px 12px",
              }}
            >
              EB
            </div>
            <div style={{ color: OS, fontSize: 26, fontWeight: 600 }}>{SITE.nom}</div>
          </div>
          <div style={{ color: ATTENUE, fontSize: 19, letterSpacing: 3, textTransform: "uppercase" }}>
            {SITE.fonction}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: OS,
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 940,
            }}
          >
            {SITE.accroche}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 34,
              gap: 52,
              alignItems: "flex-end",
            }}
          >
            {[
              /*
               * « 0,00002 % » et non « 2·10⁻⁵ % » : le générateur d'image ne
               * dispose pas de glyphe pour les exposants et rendrait un carré
               * vide. La notation décimale dit la même chose et s'affiche
               * partout.
               */
              ["0,00002 %", "écart au modèle"],
              ["4", "modèles portés"],
              ["0", "serveur d'analyse"],
            ].map(([valeur, libelle]) => (
              <div key={libelle} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ color: SIGNAL, fontSize: 40, fontWeight: 700 }}>{valeur}</div>
                <div
                  style={{
                    color: ATTENUE,
                    fontSize: 17,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {libelle}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${TRAIT}`,
            paddingTop: 20,
            color: ATTENUE,
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Une base SQL et un modèle de recherche tournent dans cette page
        </div>
      </div>
    ),
    size,
  );
}
