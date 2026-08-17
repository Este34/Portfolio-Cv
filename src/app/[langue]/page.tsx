import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CarteTravail } from "@/components/carte-travail";
import { SectionCorpus } from "@/components/corpus/section-corpus";
import { FondAnime } from "@/components/fond/fond-anime";
import { Portrait } from "@/components/portrait";
import { UI } from "@/content/interface";
import { ACCUEIL } from "@/content/pages";
import { TRAVAUX_TRIES } from "@/content/travaux";
import { estLangue, lien, t } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";
import { SITE } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[langue]">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({ langue, chemin: "/", description: SITE.description[langue] });
}

export default async function Accueil({ params }: PageProps<"/[langue]">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  return (
    <>
      {/* ---- Bandeau d'accueil -------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        {/*
          Le fond dessine un champ scalaire par ses courbes de niveau : c'est la
          figure du métier plutôt qu'un ornement. Il est décoratif au sens
          strict — aucune information ne s'y trouve — donc il disparaît sans
          WebGL, se fige en mouvement réduit, et s'éteint dès qu'il sort du
          champ.
        */}
        <FondAnime />

        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid gap-10 py-14 lg:grid-cols-[1.5fr_1fr] lg:gap-14 lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="annotation text-corail">{t(SITE.surTitre, langue)}</p>

              <h1 className="text-display text-texte mt-3 uppercase">
                {t(SITE.accroche, langue).replace(/\.$/, "")}
              </h1>

              <p className="text-texte-attenue mt-7 max-w-xl text-lg leading-relaxed">
                {t(SITE.sousTitre, langue)}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={lien("/travaux", langue)}
                  className="bloc-corail px-6 py-3 text-sm font-bold tracking-tight uppercase transition-transform duration-200 ease-(--ease-signal) hover:-translate-y-0.5"
                >
                  {t(UI.voirLesTravaux, langue)}
                </Link>
                <Link
                  href={lien("/labo", langue)}
                  className="border-trait-fort text-texte hover:bloc-citron bg-fond/70 border-2 px-6 py-3 text-sm font-bold tracking-tight uppercase transition-colors"
                >
                  {t(UI.leLabo, langue)}
                </Link>
              </div>
            </div>

            <Portrait
              langue={langue}
              className="mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none lg:self-center"
            />
          </div>
        </div>
      </section>

      {/* ---- Chiffres, en aplats ------------------------------------------ */}
      <section aria-label={t(UI.chiffresCles, langue)}>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-4">
          {ACCUEIL.chiffres.map((c) => (
            <div key={c.bloc} className={`${c.bloc} flex flex-col gap-1 px-5 py-7`}>
              <dd className="font-display tabulaire text-3xl leading-none font-black tracking-tight">
                {t(c.valeur, langue)}
              </dd>
              <dt className="text-xs font-semibold uppercase opacity-80">{t(c.libelle, langue)}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Le récit ------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
          <div>
            <p className="annotation text-corail">{t(ACCUEIL.recit.surTitre, langue)}</p>
            <h2 className="text-titre text-texte mt-2 uppercase">
              {t(ACCUEIL.recit.titre, langue)}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {ACCUEIL.recit.paragraphes.map((p) => (
              <p key={p.fr.slice(0, 32)} className="text-texte-attenue leading-relaxed">
                {t(p, langue)}
              </p>
            ))}

            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href={lien("/parcours", langue)}
                className="border-trait-fort text-texte hover:bloc-citron border-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors"
              >
                {t(UI.leParcoursEnDetail, langue)}
              </Link>
              <Link
                href={lien("/methode", langue)}
                className="border-trait-fort text-texte hover:bloc-citron border-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors"
              >
                {t(UI.commentJeTravaille, langue)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SectionCorpus langue={langue} />

      {/* ---- Travaux ------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-titre text-texte uppercase">{t(ACCUEIL.travaux, langue)}</h2>
          <Link
            href={lien("/travaux", langue)}
            className="annotation text-texte hover:text-corail shrink-0 transition-colors"
          >
            {t(UI.toutVoir, langue)}
          </Link>
        </div>

        <div>
          {TRAVAUX_TRIES.map((travail, i) => (
            <CarteTravail key={travail.slug} travail={travail} index={i} langue={langue} />
          ))}
        </div>
      </section>
    </>
  );
}
