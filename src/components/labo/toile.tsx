"use client";

import { useEffect, useRef, useState } from "react";

export type ContexteToile = {
  ctx: CanvasRenderingContext2D;
  largeur: number;
  hauteur: number;
  /** Secondes écoulées depuis la frame précédente, plafonnées. */
  dt: number;
  /** Position du curseur en coordonnées CSS, ou null s'il est sorti. */
  souris: { x: number; y: number } | null;
};

export type Pilote = {
  /** Appelé au montage et à chaque redimensionnement. */
  initialiser?: (c: Omit<ContexteToile, "dt">) => void;
  /** Appelé à chaque frame. */
  dessiner: (c: ContexteToile) => void;
  /** Appelé sur clic. */
  auClic?: (c: Omit<ContexteToile, "dt">) => void;
};

/**
 * Harnais commun aux démonstrations du labo.
 *
 * Prend en charge ce qu'on réécrit sinon dans chaque démo, et qu'on finit
 * toujours par bâcler quelque part :
 *
 *  - la densité de pixels de l'écran, pour que rien ne soit flou sur un
 *    portable moderne ;
 *  - l'arrêt de la boucle quand la section sort du champ ou que l'onglet
 *    passe en arrière-plan — une simulation invisible qui continue de tourner
 *    est du chauffage, pas du rendu ;
 *  - `prefers-reduced-motion` : une image fixe est calculée, puis plus rien
 *    ne bouge ;
 *  - un `dt` plafonné, pour qu'un retour d'onglet après une minute ne fasse
 *    pas exploser la simulation d'un seul pas d'intégration.
 */
export function Toile({
  pilote,
  ratio = 16 / 10,
  className = "",
  label,
}: {
  pilote: Pilote;
  ratio?: number;
  className?: string;
  label: string;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const souris = useRef<{ x: number; y: number } | null>(null);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hote = conteneur.current;
    const toile = canvas.current;
    if (!hote || !toile) return;

    const ctx = toile.getContext("2d");
    if (!ctx) return;

    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let largeur = 0;
    let hauteur = 0;
    let brut = 0;
    let precedent = performance.now();
    let actif = true;

    function redimensionner() {
      if (!hote || !toile || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      largeur = hote.clientWidth;
      hauteur = Math.round(largeur / ratio);
      toile.width = Math.round(largeur * dpr);
      toile.height = Math.round(hauteur * dpr);
      toile.style.height = `${hauteur}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pilote.initialiser?.({ ctx, largeur, hauteur, souris: souris.current });
    }

    function frame(maintenant: number) {
      if (!actif || !ctx) return;
      // 50 ms de plafond : au-delà, on préfère ralentir la simulation plutôt
      // que de lui faire franchir un pas d'intégration ingérable.
      const dt = Math.min((maintenant - precedent) / 1000, 0.05);
      precedent = maintenant;
      pilote.dessiner({ ctx, largeur, hauteur, dt, souris: souris.current });
      if (!reduit) brut = requestAnimationFrame(frame);
    }

    const observateurTaille = new ResizeObserver(redimensionner);
    observateurTaille.observe(hote);

    const observateurVue = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting && !actif) {
          actif = true;
          precedent = performance.now();
          brut = requestAnimationFrame(frame);
        } else if (!e.isIntersecting) {
          actif = false;
          cancelAnimationFrame(brut);
        }
      },
      { threshold: 0.05 },
    );
    observateurVue.observe(hote);

    function onSouris(e: PointerEvent) {
      if (!toile) return;
      const r = toile.getBoundingClientRect();
      souris.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function onSortie() {
      souris.current = null;
    }
    function onClic() {
      if (!ctx) return;
      pilote.auClic?.({ ctx, largeur, hauteur, souris: souris.current });
    }

    toile.addEventListener("pointermove", onSouris);
    toile.addEventListener("pointerleave", onSortie);
    toile.addEventListener("click", onClic);

    redimensionner();
    brut = requestAnimationFrame(frame);

    return () => {
      actif = false;
      cancelAnimationFrame(brut);
      observateurTaille.disconnect();
      observateurVue.disconnect();
      toile.removeEventListener("pointermove", onSouris);
      toile.removeEventListener("pointerleave", onSortie);
      toile.removeEventListener("click", onClic);
    };
  }, [ratio, pilote]);

  return (
    <div
      ref={conteneur}
      className={`border-trait bg-fond-eleve rounded-panneau relative overflow-hidden border ${className}`}
    >
      <canvas ref={canvas} aria-label={label} role="img" className="block w-full" />
      <span className="annotation absolute top-2 right-3">{visible ? "actif" : "en pause"}</span>
    </div>
  );
}
