import Image from "next/image";

import { PORTRAIT } from "@/lib/site";

/**
 * Portrait en bichromie.
 *
 * Le traitement est un vrai duotone, pas une teinte plaquée : la luminance est
 * d'abord extraite, puis remappée sur deux couleurs — les ombres vers l'encre,
 * les hautes lumières vers l'ambre du signal. Un simple `mix-blend-mode: color`
 * aurait donné un monochrome teinté, plat et sale dans les gris.
 *
 * Rendu côté serveur, sans JavaScript : c'est un filtre SVG appliqué en CSS.
 *
 * Si `PORTRAIT` vaut `null`, le composant ne rend rien du tout — le bandeau
 * d'accueil se replie alors sur sa mise en page sans photo.
 */
export function Portrait({ className = "" }: { className?: string }) {
  if (!PORTRAIT) return null;

  return (
    <figure className={`relative ${className}`}>
      {/*
        Le filtre vit dans un SVG de taille nulle : il n'occupe aucune place
        dans le flux, il ne sert que de définition réutilisable.
      */}
      <svg aria-hidden="true" className="absolute h-0 w-0" focusable="false">
        <defs>
          <filter id="duotone-signal" colorInterpolationFilters="sRGB">
            {/* Luminance perçue — pondération Rec. 709, pas une moyenne naïve. */}
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0      0      0      1 0"
            />
            {/* Ombres → #0E0E12 · hautes lumières → #FF5A3C (le corail Signal) */}
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.055 1" />
              <feFuncG type="table" tableValues="0.055 0.353" />
              <feFuncB type="table" tableValues="0.071 0.235" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <div className="relative">
        {/*
          La photo source est détourée sur blanc. Sans masque, le duotone
          transformerait tout l'arrière-plan en aplat ambre et poserait un
          rectangle criard au milieu de la page. Le dégradé radial fait
          disparaître les bords dans le fond : il ne reste que le sujet, cerné
          d'un halo de lumière signal.
        */}
        <Image
          src={PORTRAIT.src}
          alt={PORTRAIT.alt}
          width={1024}
          height={1247}
          priority
          sizes="(min-width: 1024px) 24rem, 55vw"
          className="h-full w-full object-cover [filter:url(#duotone-signal)] [mask-image:radial-gradient(ellipse_68%_74%_at_50%_42%,black_45%,transparent_100%)]"
        />

        {/*
          Une seule étiquette, en aplat plein. La version précédente posait ici
          « Sujet / 01 » et les dimensions du fichier — du vocabulaire
          d'instrument de mesure, qui n'a plus lieu d'être et qui donnait au
          portrait l'air d'une pièce à conviction.
        */}
        <span className="bloc-citron absolute bottom-0 left-0 px-2 py-1 text-xs font-bold uppercase">
          Esteban
        </span>
      </div>
    </figure>
  );
}
