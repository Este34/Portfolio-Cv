"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { locale, type Langue } from "@/lib/langue";

const MOTS = {
  fr: {
    label: (n: number) => `Nuage des ${n} passages du corpus, projetés en deux dimensions`,
    variance: "de variance conservée",
    invite: "Survolez un point pour lire le passage. Cliquez pour aller à sa source.",
  },
  en: {
    label: (n: number) => `Cloud of the ${n} corpus passages, projected onto two dimensions`,
    variance: "of variance retained",
    invite: "Hover a point to read the passage. Click to go to its source.",
  },
} as const;

export type PointCorpus = {
  xy: [number, number];
  source: string;
  href: string;
  apercu: string;
};

/**
 * Nuage du corpus vectorisé.
 *
 * Chaque point est un des passages que le moteur de recherche compare à votre
 * question, projeté de 384 dimensions vers deux par analyse en composantes
 * principales. La couleur regroupe les passages d'une même source.
 *
 * Ce n'est pas une décoration : c'est le contenu réel de `embeddings.bin`.
 * Deux passages proches à l'écran le sont aussi dans l'espace du modèle — c'est
 * la propriété qu'une projection linéaire garantit et qu'un t-SNE ne garantit
 * pas.
 *
 * Pas de boucle d'animation : la figure est fixe, elle n'est redessinée qu'au
 * survol. Une simulation qui tourne pour rien est du chauffage.
 */
export function NuageCorpus({
  points,
  variance,
  langue,
  etiquettes,
}: {
  points: PointCorpus[];
  variance: number;
  langue: Langue;
  /**
   * Étiquette de groupe de chaque point, si la coloration ne suit pas la
   * source. Elle sert à la couleur et à la légende ; l'infobulle continue
   * d'afficher la vraie source, qui reste l'information dont le lecteur a
   * besoin pour aller vérifier.
   */
  etiquettes?: readonly string[];
}) {
  const mots = MOTS[langue];
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const conteneur = useRef<HTMLDivElement>(null);
  const [survol, setSurvol] = useState<number | null>(null);

  /*
   * Sources distinctes, dans l'ordre d'apparition — mémoïsées.
   *
   * Sans `useMemo`, ce tableau est recréé à chaque rendu, donc `dessiner`
   * change d'identité à chaque rendu, donc l'effet se rejoue et recrée
   * l'observateur de taille. Le survol d'un point suffisait alors à
   * reconstruire tout le harnais.
   */
  const groupes = useMemo(
    () => (etiquettes && etiquettes.length === points.length ? etiquettes : points.map((p) => p.source)),
    [etiquettes, points],
  );
  const legende = useMemo(() => [...new Set(groupes)], [groupes]);

  const dessiner = useCallback(() => {
    const toile = canvas.current;
    const hote = conteneur.current;
    if (!toile || !hote) return;
    const ctx = toile.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const jeton = (n: string, r: string) => styles.getPropertyValue(n).trim() || r;
    const palette = ["--serie-1", "--serie-2", "--serie-3", "--serie-4", "--serie-5"].map((s, i) =>
      jeton(s, ["#2b4cf2", "#ff5a3c", "#e8ff54", "#3ce0c0", "#c07cff"][i]),
    );
    const trait = jeton("--trait", "#2c2c36");
    const fond = jeton("--fond-eleve", "#16161c");

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const l = hote.clientWidth;
    const h = hote.clientHeight;
    toile.width = Math.round(l * dpr);
    toile.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, l, h);

    // Marge : sans elle les points des bords sont coupés en deux.
    const m = 26;
    const px = (x: number) => m + x * (l - m * 2);
    const py = (y: number) => m + (1 - y) * (h - m * 2);

    // Grille discrète — un repère, pas un motif.
    ctx.strokeStyle = trait;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gx = m + (i / 4) * (l - m * 2);
      const gy = m + (i / 4) * (h - m * 2);
      ctx.beginPath();
      ctx.moveTo(gx, m);
      ctx.lineTo(gx, h - m);
      ctx.moveTo(m, gy);
      ctx.lineTo(l - m, gy);
      ctx.stroke();
    }

    points.forEach((p, i) => {
      /*
       * Huit sources pour cinq couleurs : au-delà de la cinquième, le marqueur
       * passe en cercle creux plutôt que plein. Sans cette variation de forme,
       * « Parcours » portait la même couleur que « Présentation » et « Labo »
       * que « La plateforme » — une couleur qui se répète ne renseigne plus.
       * La forme a en outre l'avantage de rester lisible sans percevoir la
       * teinte.
       */
      const rang = legende.indexOf(groupes[i]);
      const couleur = palette[rang % palette.length];
      const creux = rang >= palette.length;

      const actif = survol === i;
      const r = actif ? 8 : 4.5;

      ctx.beginPath();
      ctx.arc(px(p.xy[0]), py(p.xy[1]), r, 0, Math.PI * 2);
      ctx.globalAlpha = actif ? 1 : 0.8;

      if (creux) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = couleur;
        ctx.stroke();
      } else {
        ctx.fillStyle = couleur;
        ctx.fill();
      }

      if (actif) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = creux ? couleur : fond;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }, [points, groupes, legende, survol]);

  useEffect(() => {
    dessiner();
    const obs = new ResizeObserver(dessiner);
    if (conteneur.current) obs.observe(conteneur.current);
    return () => obs.disconnect();
  }, [dessiner]);

  /** Point le plus proche du curseur, dans un rayon de préhension. */
  function plusProche(ex: number, ey: number): number | null {
    const hote = conteneur.current;
    if (!hote) return null;
    const l = hote.clientWidth;
    const h = hote.clientHeight;
    const m = 26;
    let meilleur: number | null = null;
    let min = 18 * 18;
    points.forEach((p, i) => {
      const dx = m + p.xy[0] * (l - m * 2) - ex;
      const dy = m + (1 - p.xy[1]) * (h - m * 2) - ey;
      const d = dx * dx + dy * dy;
      if (d < min) {
        min = d;
        meilleur = i;
      }
    });
    return meilleur;
  }

  const actif = survol !== null ? points[survol] : null;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={conteneur}
        className="border-trait-fort bg-fond-eleve relative aspect-[4/3] w-full border-2"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setSurvol(plusProche(e.clientX - r.left, e.clientY - r.top));
        }}
        onPointerLeave={() => setSurvol(null)}
        onClick={() => {
          if (actif) router.push(actif.href);
        }}
        style={{ cursor: actif ? "pointer" : "default" }}
      >
        {/*
          Positionnement absolu, et ce n'est pas cosmétique.

          En flux normal, un canvas porte une taille intrinsèque tirée de ses
          attributs `width` et `height` — ceux-là mêmes que le composant calcule
          depuis la hauteur mesurée du conteneur, multipliée par la densité de
          pixels. La boucle se referme : le canvas grossit, il pousse la boîte à
          rapport d'aspect qui l'héberge, la mesure suivante donne une hauteur
          plus grande, et ainsi de suite. La page passait de 5900 à 8400 pixels
          de haut en trois mesures, ce qui ne s'est vu qu'en tentant de la
          photographier entière.

          Hors du flux, le canvas ne peut plus rien pousser du tout.
        */}
        <canvas
          ref={canvas}
          role="img"
          aria-label={mots.label(points.length)}
          className="absolute inset-0 block h-full w-full"
        />

        <span className="annotation text-texte-faible absolute right-3 bottom-2">
          {/* Séparateur décimal et espace avant le signe : selon la langue. */}
          {variance.toLocaleString(locale(langue), { minimumFractionDigits: 1 })}
          {langue === "fr" ? " % " : "% "}
          {mots.variance}
        </span>
      </div>

      {/* Zone de lecture de hauteur fixe : sans elle, la page sursaute à
          chaque survol. */}
      <div className="border-trait bg-surface min-h-[5.5rem] border p-3">
        {actif ? (
          <>
            <p className="text-corail text-xs font-bold uppercase">{actif.source}</p>
            <p className="text-texte-attenue mt-1.5 text-sm leading-relaxed">{actif.apercu}</p>
          </>
        ) : (
          <p className="text-texte-faible text-sm">
            {mots.invite}
          </p>
        )}
      </div>

      {/* Légende — sans elle, la couleur ne veut rien dire. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {legende.map((s, i) => {
          const couleur = `var(--serie-${(i % 5) + 1})`;
          const creux = i >= 5;
          return (
            <li key={s} className="flex items-center gap-1.5">
              {/* Plein puis creux : voir la note sur les marqueurs du nuage. */}
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={
                  creux
                    ? { border: `2px solid ${couleur}` }
                    : { background: couleur }
                }
              />
              <span className="annotation text-texte-attenue">{s}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
