import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TRAVAUX, TRAVAUX_TRIES, travailParSlug } from "@/content/travaux";

export function generateStaticParams() {
  return TRAVAUX.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/travaux/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const travail = travailParSlug(slug);
  if (!travail) return {};

  return {
    title: travail.titre,
    description: travail.resume,
    openGraph: { title: travail.titre, description: travail.resume, type: "article" },
  };
}

export default async function PageTravail({ params }: PageProps<"/travaux/[slug]">) {
  const { slug } = await params;
  const travail = travailParSlug(slug);
  if (!travail) notFound();

  const index = TRAVAUX_TRIES.findIndex((t) => t.slug === travail.slug);
  const suivant = TRAVAUX_TRIES[(index + 1) % TRAVAUX_TRIES.length];
  const numero = String(index + 1).padStart(3, "0");

  return (
    <article className="mx-auto max-w-6xl px-5">
          <div className="border-trait flex items-center justify-between border-b py-3">
            <span className="annotation">Travail / {numero}</span>
            <span className="annotation">{travail.annee}</span>
          </div>

          {/* ---- Titre ---------------------------------------------------- */}
          <header className="grid gap-10 py-16 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:py-20">
            <div>
              <h1 className="font-display text-titre text-texte font-semibold">{travail.titre}</h1>
              <p className="text-texte-attenue mt-3 text-lg">{travail.sousTitre}</p>
              <p className="text-texte-attenue mt-6 max-w-2xl leading-relaxed">{travail.resume}</p>

              {(travail.liens.demo || travail.liens.depot) && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {travail.liens.demo && (
                    <a
                      href={travail.liens.demo}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-signal text-fond rounded-instrument hover:bg-signal-vif px-5 py-2.5 text-sm font-medium transition-colors"
                    >
                      Voir la démonstration ↗
                    </a>
                  )}
                  {travail.liens.depot && (
                    <a
                      href={travail.liens.depot}
                      target="_blank"
                      rel="noreferrer"
                      className="border-trait-fort text-texte hover:border-signal hover:text-signal rounded-instrument border px-5 py-2.5 text-sm font-medium transition-colors"
                    >
                      Le dépôt ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            <dl className="border-trait divide-trait h-fit divide-y border-y">
              <div className="flex gap-4 py-3">
                <dt className="annotation w-28 shrink-0">Rôle</dt>
                <dd className="text-texte-attenue text-sm">{travail.role}</dd>
              </div>
              <div className="flex gap-4 py-3">
                <dt className="annotation w-28 shrink-0">Domaines</dt>
                <dd className="text-texte-attenue text-sm">{travail.domaines.join(" · ")}</dd>
              </div>
              <div className="flex gap-4 py-3">
                <dt className="annotation w-28 shrink-0">Diffusion</dt>
                <dd className="text-texte-attenue text-sm">
                  {travail.confidentialite === "public"
                    ? "Dépôt public"
                    : "Présenté sous anonymat, à la demande du commanditaire"}
                </dd>
              </div>
              <div className="flex gap-4 py-3">
                <dt className="annotation w-28 shrink-0">Stack</dt>
                <dd className="text-texte-attenue text-sm">{travail.stack.join(", ")}</dd>
              </div>
            </dl>
          </header>

          {/* ---- Chiffres ------------------------------------------------- */}
          <section aria-label="Chiffres" className="border-trait border-t">
            <dl className="divide-trait grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
              {travail.chiffres.map((c) => (
                <div key={c.libelle} className="border-trait border-b px-1 py-6 lg:border-b-0 lg:px-5">
                  <dt className="annotation">{c.libelle}</dt>
                  <dd className="font-display text-texte tabulaire mt-2 text-2xl font-semibold tracking-tight">
                    {c.valeur}
                  </dd>
                  {c.note && (
                    <p className="annotation text-texte-faible mt-1.5 normal-case">{c.note}</p>
                  )}
                </div>
              ))}
            </dl>
          </section>

          {/* ---- Récit ----------------------------------------------------- */}
          <div className="grid gap-16 py-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
            <Section titre="Contexte">
              <p className="text-texte-attenue leading-relaxed">{travail.contexte}</p>
            </Section>

            <Section titre="Contraintes">
              <ul className="space-y-3">
                {travail.contraintes.map((c) => (
                  <li key={c} className="text-texte-attenue flex gap-3 leading-relaxed">
                    <span aria-hidden="true" className="text-signal mt-2 h-px w-4 shrink-0 bg-current" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section titre="Décisions">
              <ol className="divide-trait divide-y">
                {travail.decisions.map((d, i) => (
                  <li key={d.choix} className="py-6 first:pt-0 last:pb-0">
                    <span className="annotation">Décision {String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-display text-texte mt-2 text-lg font-semibold tracking-tight">
                      {d.choix}
                    </h3>
                    <p className="text-texte-attenue mt-2 leading-relaxed">{d.raison}</p>
                  </li>
                ))}
              </ol>
            </Section>

            <Section titre="Résultats">
              <ul className="space-y-3">
                {travail.resultats.map((r) => (
                  <li key={r} className="text-texte-attenue flex gap-3 leading-relaxed">
                    <span aria-hidden="true" className="text-signal mt-2 h-px w-4 shrink-0 bg-current" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* ---- Suite ------------------------------------------------------ */}
          <nav className="border-trait border-t py-10" aria-label="Travail suivant">
            <Link href={`/travaux/${suivant.slug}`} className="group block">
              <span className="annotation">Travail suivant</span>
              <p className="font-display text-texte group-hover:text-signal mt-2 text-xl font-semibold tracking-tight transition-colors">
                {suivant.titre} →
              </p>
            </Link>
      </nav>
    </article>
  );
}

/** Bloc de récit : un titre collant à gauche, le contenu à droite. */
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="font-display text-texte h-fit text-sm font-semibold tracking-widest uppercase lg:sticky lg:top-20">
        {titre}
      </h2>
      <div className="lg:pb-4">{children}</div>
    </>
  );
}
