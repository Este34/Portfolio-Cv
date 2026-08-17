import Link from "next/link";

import { CarteTravail } from "@/components/carte-travail";
import { SectionCorpus } from "@/components/corpus/section-corpus";
import { Portrait } from "@/components/portrait";
import { TRAVAUX_TRIES } from "@/content/travaux";
import { SITE } from "@/lib/site";

/**
 * Chiffres de tête.
 *
 * Posés en aplats de couleur pleine, côte à côte, sur toute la largeur : c'est
 * le geste signature de la direction. La version précédente les alignait en
 * gris sur gris, ce qui les rendait invisibles alors qu'ils sont l'argument le
 * plus solide du site.
 *
 * « 0,00002 % » plutôt que « 2·10⁻⁵ % » : la notation scientifique est juste
 * mais elle se lit mal en très gros corps, et un recruteur ne s'arrête pas
 * pour décoder un exposant.
 */
const CHIFFRES_CLES = [
  { valeur: "0,00002 %", libelle: "écart au modèle d'origine", bloc: "bloc-bleu" },
  { valeur: "4", libelle: "modèles de prospective portés", bloc: "bloc-corail" },
  { valeur: "240", libelle: "pays dans le pipeline", bloc: "bloc-citron" },
  { valeur: "0", libelle: "serveur d'analyse", bloc: "bg-trait-fort text-fond" },
] as const;

export default function Accueil() {
  return (
    <>
      {/* ---- Bandeau d'accueil -------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 py-14 lg:grid-cols-[1.5fr_1fr] lg:gap-14 lg:py-20">
          <div className="flex flex-col justify-center">
            <h1 className="text-display text-texte uppercase">
              {SITE.accroche.replace(/\.$/, "")}
            </h1>

            <p className="text-texte-attenue mt-7 max-w-xl text-lg leading-relaxed">
              {SITE.sousTitre}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/travaux"
                className="bloc-corail px-6 py-3 text-sm font-bold uppercase tracking-tight transition-transform duration-200 ease-(--ease-signal) hover:-translate-y-0.5"
              >
                Voir les travaux
              </Link>
              <Link
                href="/labo"
                className="border-trait-fort text-texte hover:bloc-citron border-2 px-6 py-3 text-sm font-bold uppercase tracking-tight transition-colors"
              >
                Le labo
              </Link>
            </div>
          </div>

          <Portrait className="mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none lg:self-center" />
        </div>
      </section>

      {/* ---- Chiffres, en aplats ------------------------------------------ */}
      <section aria-label="Chiffres clés">
        <dl className="grid sm:grid-cols-2 lg:grid-cols-4">
          {CHIFFRES_CLES.map((c) => (
            <div key={c.libelle} className={`${c.bloc} flex flex-col gap-1 px-5 py-7`}>
              <dd className="font-display tabulaire text-3xl leading-none font-black tracking-tight">
                {c.valeur}
              </dd>
              <dt className="text-xs font-semibold uppercase opacity-80">{c.libelle}</dt>
            </div>
          ))}
        </dl>
      </section>

      <SectionCorpus />

      {/* ---- Travaux ------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-titre text-texte uppercase">Travaux</h2>
          <Link
            href="/travaux"
            className="annotation text-texte hover:text-corail shrink-0 transition-colors"
          >
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
