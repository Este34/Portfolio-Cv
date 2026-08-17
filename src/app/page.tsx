import Link from "next/link";

import { CarteTravail } from "@/components/carte-travail";
import { SectionGlobe } from "@/components/globe/section-globe";
import { Portrait } from "@/components/portrait";
import { TRAVAUX_TRIES } from "@/content/travaux";
import { SITE } from "@/lib/site";

/**
 * Chiffres de tête.
 *
 * Choisis pour qu'un lecteur qui ne lira rien d'autre reparte avec la bonne
 * idée : de la fidélité mesurée, du volume, et zéro infrastructure.
 */
const CHIFFRES_CLES = [
  { valeur: "2·10⁻⁵ %", libelle: "écart au modèle d'origine", note: "vérifié à chaque génération" },
  { valeur: "4", libelle: "modèles de prospective portés", note: "horizon 2050" },
  { valeur: "240", libelle: "pays dans le pipeline", note: "sur 25 ans de déclarations" },
  { valeur: "0", libelle: "serveur d'analyse", note: "tout s'exécute côté client" },
] as const;

export default function Accueil() {
  return (
    <>
      {/* ---- Bandeau d'accueil ------------------------------------------ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="trame pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
          />

          <div className="relative mx-auto max-w-6xl px-5">
            <div className="border-trait flex items-center justify-between border-b py-3">
              <span className="annotation">Index / 001</span>
              <span className="annotation">{TRAVAUX_TRIES.length} travaux · 2024—2026</span>
            </div>

            <div className="grid gap-12 py-20 lg:grid-cols-[1.35fr_1fr] lg:gap-16 lg:py-28">
              <div>
                <h1 className="font-display text-display text-texte font-semibold">
                  {SITE.accroche}
                </h1>

                <p className="text-texte-attenue mt-8 max-w-xl text-lg leading-relaxed">
                  {SITE.sousTitre}
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Link
                    href="/travaux"
                    className="bg-signal text-fond rounded-instrument hover:bg-signal-vif px-5 py-2.5 text-sm font-medium transition-colors"
                  >
                    Voir les travaux
                  </Link>
                  <Link
                    href="/methode"
                    className="border-trait-fort text-texte hover:border-signal hover:text-signal rounded-instrument border px-5 py-2.5 text-sm font-medium transition-colors"
                  >
                    Comment je travaille
                  </Link>
                </div>
              </div>

              <Portrait className="mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none lg:self-center" />
            </div>
          </div>
        </section>

        {/* ---- Chiffres ---------------------------------------------------- */}
        <section aria-label="Chiffres clés" className="border-trait border-y">
          <dl className="divide-trait mx-auto grid max-w-6xl divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {CHIFFRES_CLES.map((c) => (
              <div key={c.libelle} className="px-5 py-7">
                <dt className="annotation">{c.libelle}</dt>
                <dd className="font-display text-texte tabulaire mt-2 text-3xl font-semibold tracking-tight">
                  {c.valeur}
                </dd>
                <p className="annotation text-texte-faible mt-1.5 normal-case">{c.note}</p>
              </div>
            ))}
          </dl>
        </section>

        <SectionGlobe />

        {/* ---- Travaux ------------------------------------------------------ */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-titre text-texte font-semibold">Travaux</h2>
            <Link href="/travaux" className="annotation hover:text-signal transition-colors">
              Tout voir →
            </Link>
          </div>

          <div>
            {TRAVAUX_TRIES.map((travail, i) => (
              <CarteTravail key={travail.slug} travail={travail} index={i} />
            ))}
          </div>
      </section>
    </>
  );
}
