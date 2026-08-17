import Link from "next/link";

import type { Travail } from "@/content/travaux";

/** Une couleur par entrée, en rotation : c'est la couleur qui numérote. */
const BLOCS = ["bloc-bleu", "bloc-corail", "bloc-citron", "bg-trait-fort text-fond"] as const;

/**
 * Carte d'un travail dans une liste.
 *
 * Le numéro d'ordre est posé dans un aplat de couleur pleine plutôt qu'en
 * petites capitales grises. La version précédente le noyait dans le même gris
 * que tout le reste, ce qui donnait quatre lignes de texte indistinctes ; ici
 * la couleur fait le repérage que la typographie ne peut pas faire seule.
 */
export function CarteTravail({ travail, index }: { travail: Travail; index: number }) {
  const bloc = BLOCS[index % BLOCS.length];

  return (
    <article className="border-trait group border-t last:border-b">
      <Link href={`/travaux/${travail.slug}`} className="block py-7 focus:outline-none">
        <div className="grid gap-5 lg:grid-cols-[4.5rem_1fr_auto] lg:gap-8">
          <div className="flex items-start gap-3 lg:flex-col lg:gap-2">
            <span
              className={`${bloc} font-display tabulaire grid size-11 place-items-center text-lg leading-none font-black`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="annotation tabulaire pt-1 lg:pt-0">{travail.annee}</span>
          </div>

          <div className="max-w-2xl">
            <h3 className="text-texte group-hover:text-corail text-xl uppercase transition-colors">
              {travail.titre}
            </h3>
            <p className="text-texte-attenue mt-1 text-sm font-semibold">{travail.sousTitre}</p>
            <p className="text-texte-attenue mt-3 text-sm leading-relaxed">{travail.resume}</p>

            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
              {travail.stack.slice(0, 6).map((tech) => (
                <li
                  key={tech}
                  className="border-trait text-texte-attenue border px-2 py-0.5 text-xs font-semibold"
                >
                  {tech}
                </li>
              ))}
              {travail.stack.length > 6 && (
                <li className="annotation self-center">+{travail.stack.length - 6}</li>
              )}
            </ul>
          </div>

          <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:justify-between">
            <span className="annotation">
              {travail.confidentialite === "public" ? "dépôt public" : "sous anonymat"}
            </span>
            <span
              aria-hidden="true"
              className="text-texte-faible group-hover:text-corail text-2xl leading-none font-black transition-transform duration-300 ease-(--ease-signal) group-hover:translate-x-1"
            >
              →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
