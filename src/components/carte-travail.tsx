import Link from "next/link";

import type { Travail } from "@/content/travaux";

/**
 * Carte d'un travail dans une liste.
 *
 * Le numéro d'index et le rappel de confidentialité sont posés en annotation :
 * c'est la signature de lecture de tout le site, et ça évite un badge coloré de
 * plus dans une palette qui n'en veut pas.
 */
export function CarteTravail({ travail, index }: { travail: Travail; index: number }) {
  const numero = String(index + 1).padStart(3, "0");

  return (
    <article className="group border-trait hover:border-trait-fort relative border-t transition-colors">
      <Link href={`/travaux/${travail.slug}`} className="block py-8 focus:outline-none">
        <div className="grid gap-5 lg:grid-cols-[7rem_1fr_auto] lg:gap-8">
          <div className="flex items-baseline gap-3 lg:block">
            <span className="annotation group-hover:text-signal transition-colors">{numero}</span>
            <span className="annotation lg:mt-2 lg:block">{travail.annee}</span>
          </div>

          <div className="max-w-2xl">
            <h3 className="font-display text-texte group-hover:text-signal text-xl font-semibold tracking-tight transition-colors">
              {travail.titre}
            </h3>
            <p className="text-texte-attenue mt-1 text-sm">{travail.sousTitre}</p>
            <p className="text-texte-attenue mt-3 text-sm leading-relaxed">{travail.resume}</p>

            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Technologies">
              {travail.stack.slice(0, 6).map((tech) => (
                <li key={tech} className="annotation text-texte-faible">
                  {tech}
                </li>
              ))}
              {travail.stack.length > 6 && (
                <li className="annotation text-texte-faible">+{travail.stack.length - 6}</li>
              )}
            </ul>
          </div>

          <div className="lg:text-right">
            <span className="annotation">
              {travail.confidentialite === "public" ? "dépôt public" : "sous anonymat"}
            </span>
            <span
              aria-hidden="true"
              className="text-texte-faible group-hover:text-signal mt-3 hidden text-lg transition-transform duration-300 ease-(--ease-instrument) group-hover:translate-x-1 lg:block"
            >
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
