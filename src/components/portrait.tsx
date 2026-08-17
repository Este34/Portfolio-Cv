import Image from "next/image";

import { t, type Langue } from "@/lib/langue";
import { PORTRAIT } from "@/lib/site";

/**
 * Portrait.
 *
 * **Le duotone a été abandonné, et c'est une correction, pas un renoncement.**
 * La photo source est détourée sur blanc : en remappant la luminance sur deux
 * couleurs, tout l'arrière-plan basculait en aplat corail plein et le visage
 * s'y noyait — le résultat ressemblait à une photo passée au filtre rouge. Le
 * masque radial censé dissoudre les bords produisait en plus un halo qui faisait
 * tache sur fond clair.
 *
 * Traitement retenu : désaturation et léger gain de contraste, dans un cadre
 * franc. Le visage reste lisible, ce qui est le seul critère qui compte pour un
 * portrait, et le bloc photographique dialogue avec les aplats de couleur du
 * reste de la page au lieu de leur faire concurrence.
 */
export function Portrait({ langue, className = "" }: { langue: Langue; className?: string }) {
  if (!PORTRAIT) return null;

  return (
    <figure className={`relative ${className}`}>
      <div className="border-trait-fort relative border-2">
        <Image
          src={PORTRAIT.src}
          alt={t(PORTRAIT.alt, langue)}
          width={1024}
          height={1247}
          priority
          sizes="(min-width: 1024px) 24rem, 55vw"
          className="block h-full w-full object-cover grayscale-100 contrast-[1.06]"
        />

        <figcaption className="bloc-citron absolute bottom-0 left-0 px-2.5 py-1 text-xs font-bold uppercase">
          Esteban
        </figcaption>
      </div>
    </figure>
  );
}
