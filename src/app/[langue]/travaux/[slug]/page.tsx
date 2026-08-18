import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FondAnime } from "@/components/fond/fond-anime";
import { UI } from "@/content/interface";
import { TRAVAUX, TRAVAUX_TRIES, travailParSlug } from "@/content/travaux";
import { LANGUES, estLangue, lien, t, ts } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export function generateStaticParams() {
  return LANGUES.flatMap((langue) => TRAVAUX.map((tr) => ({ langue, slug: tr.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/travaux/[slug]">): Promise<Metadata> {
  const { langue, slug } = await params;
  const travail = travailParSlug(slug);
  if (!estLangue(langue) || !travail) return {};

  return metadonnees({
    langue,
    chemin: `/travaux/${travail.slug}`,
    titre: t(travail.titre, langue),
    description: t(travail.resume, langue),
  });
}

export default async function PageTravail({ params }: PageProps<"/[langue]/travaux/[slug]">) {
  const { langue, slug } = await params;
  const travail = travailParSlug(slug);
  if (!estLangue(langue) || !travail) notFound();

  const index = TRAVAUX_TRIES.findIndex((tr) => tr.slug === travail.slug);
  const suivant = TRAVAUX_TRIES[(index + 1) % TRAVAUX_TRIES.length];

  return (
    <article className="mx-auto max-w-6xl px-5">
      {/* ---- Titre ---------------------------------------------------- */}
      <header className="relative isolate grid gap-10 py-16 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:py-20">
        {/* Débordement en pleine largeur : voir la découpe horizontale dans globals.css. */}
        <FondAnime motif="trame" intensite={0.28} className="left-1/2 -z-10 w-screen -translate-x-1/2" />
        <div>
          <h1 className="font-display text-titre text-texte uppercase">{t(travail.titre, langue)}</h1>
          <p className="text-texte-attenue mt-3 text-lg">{t(travail.sousTitre, langue)}</p>
          <p className="text-texte-attenue mt-6 max-w-2xl leading-relaxed">
            {t(travail.resume, langue)}
          </p>

          {(travail.liens.demo || travail.liens.depot) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {travail.liens.demo && (
                <a
                  href={
                    travail.liens.demo.startsWith("/")
                      ? lien(travail.liens.demo, langue)
                      : travail.liens.demo
                  }
                  target={travail.liens.demo.startsWith("/") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="bloc-corail px-5 py-2.5 text-sm font-bold uppercase transition-transform duration-200 ease-(--ease-signal) hover:-translate-y-0.5"
                >
                  {t(UI.voirLaDemonstration, langue)}
                </a>
              )}
              {travail.liens.depot && (
                <a
                  href={travail.liens.depot}
                  target="_blank"
                  rel="noreferrer"
                  className="border-trait-fort text-texte hover:bloc-citron border-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors"
                >
                  {t(UI.leDepot, langue)}
                </a>
              )}
            </div>
          )}
        </div>

        <dl className="border-trait divide-trait h-fit divide-y border-y">
          <div className="flex gap-4 py-3">
            <dt className="annotation w-28 shrink-0">{t(UI.role, langue)}</dt>
            <dd className="text-texte-attenue text-sm">{t(travail.role, langue)}</dd>
          </div>
          <div className="flex gap-4 py-3">
            <dt className="annotation w-28 shrink-0">{t(UI.domaines, langue)}</dt>
            <dd className="text-texte-attenue text-sm">
              {ts(travail.domaines, langue).join(" · ")}
            </dd>
          </div>
          <div className="flex gap-4 py-3">
            <dt className="annotation w-28 shrink-0">{t(UI.diffusion, langue)}</dt>
            <dd className="text-texte-attenue text-sm">
              {travail.confidentialite === "public"
                ? t(UI.depotPublic, langue)
                : t(UI.sousAnonymat, langue)}
            </dd>
          </div>
          <div className="flex gap-4 py-3">
            <dt className="annotation w-28 shrink-0">{t(UI.stack, langue)}</dt>
            <dd className="text-texte-attenue text-sm">{travail.stack.join(", ")}</dd>
          </div>
        </dl>
      </header>

      {/* ---- Captures --------------------------------------------------- */}
      {travail.captures && travail.captures.length > 0 && (
        <section aria-label={t(UI.captures, langue)} className="grid gap-6 pb-4 sm:grid-cols-2">
          {travail.captures.map((c) => (
            <figure key={c.src} className="flex flex-col gap-2">
              <Image
                src={c.src}
                alt={t(c.legende, langue)}
                width={1440}
                height={900}
                sizes="(min-width: 640px) 50vw, 100vw"
                className="border-trait-fort w-full border-2"
              />
              <figcaption className="annotation text-texte-attenue normal-case">
                {t(c.legende, langue)}
              </figcaption>
            </figure>
          ))}
        </section>
      )}

      {/* ---- Chiffres ------------------------------------------------- */}
      <section aria-label={t(UI.chiffres, langue)} className="border-trait border-t">
        <dl className="divide-trait grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
          {travail.chiffres.map((c) => (
            <div key={c.libelle.fr} className="border-trait border-b px-1 py-6 lg:border-b-0 lg:px-5">
              <dt className="annotation">{t(c.libelle, langue)}</dt>
              <dd className="font-display text-texte tabulaire mt-2 text-2xl uppercase">
                {t(c.valeur, langue)}
              </dd>
              {c.note && (
                <p className="annotation text-texte-faible mt-1.5 normal-case">{t(c.note, langue)}</p>
              )}
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Récit ----------------------------------------------------- */}
      <div className="grid gap-16 py-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <Section titre={t(UI.contexte, langue)}>
          <p className="text-texte-attenue leading-relaxed">{t(travail.contexte, langue)}</p>
        </Section>

        <Section titre={t(UI.contraintes, langue)}>
          <ul className="space-y-3">
            {ts(travail.contraintes, langue).map((c) => (
              <li key={c} className="text-texte-attenue flex gap-3 leading-relaxed">
                <span aria-hidden="true" className="text-signal mt-2 h-px w-4 shrink-0 bg-current" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section titre={t(UI.decisions, langue)}>
          <ol className="divide-trait divide-y">
            {travail.decisions.map((d, i) => (
              <li key={d.choix.fr} className="py-6 first:pt-0 last:pb-0">
                <span className="annotation">
                  {t(UI.decision, langue)} {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-texte mt-2 text-lg">{t(d.choix, langue)}</h3>
                <p className="text-texte-attenue mt-2 leading-relaxed">{t(d.raison, langue)}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section titre={t(UI.resultats, langue)}>
          <ul className="space-y-3">
            {ts(travail.resultats, langue).map((r) => (
              <li key={r} className="text-texte-attenue flex gap-3 leading-relaxed">
                <span aria-hidden="true" className="text-signal mt-2 h-px w-4 shrink-0 bg-current" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* ---- Suite ------------------------------------------------------ */}
      <nav className="border-trait border-t py-10" aria-label={t(UI.travailSuivant, langue)}>
        <Link href={lien(`/travaux/${suivant.slug}`, langue)} className="group block">
          <span className="annotation">{t(UI.travailSuivant, langue)}</span>
          <p className="font-display text-texte group-hover:text-signal mt-2 text-xl uppercase transition-colors">
            {t(suivant.titre, langue)} →
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
      <h2 className="font-display text-texte h-fit text-sm font-black tracking-tight uppercase lg:sticky lg:top-20">
        {titre}
      </h2>
      <div className="lg:pb-4">{children}</div>
    </>
  );
}
