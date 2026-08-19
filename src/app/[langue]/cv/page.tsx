import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PAGE_CV } from "@/content/pages";
import { COMPETENCES, EXPERIENCES, FORMATION } from "@/content/parcours";
import { TRAVAUX_TRIES } from "@/content/travaux";
import { estLangue, lien, t, ts } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";
import { CONTACT, SITE, SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/cv">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/cv",
    titre: t(PAGE_CV.meta.titre, langue),
    description: t(PAGE_CV.meta.description, langue),
  });
}

/**
 * Le CV, écrit par le site.
 *
 * ## Pourquoi une page et pas un PDF déposé dans `public/`
 *
 * Un PDF déposé à la main est une copie. Il date le jour où le portfolio
 * avance, et il date en silence : rien ne signale qu'il ne décrit plus la même
 * personne. C'est exactement le défaut que ce site passe son temps à traquer
 * ailleurs — un artefact qui a cessé de correspondre à sa source.
 *
 * Cette page lit `parcours.ts`, `travaux.ts` et `site.ts`, les mêmes fichiers
 * que les études de cas. Le CV ne peut donc pas diverger du portfolio : il en
 * est une vue. Le PDF se fabrique par l'impression du navigateur, à partir
 * d'une feuille de style dédiée.
 *
 * ## Ce qui n'y est pas
 *
 * Ni adresse ni téléphone, et c'est vérifié par un test. Une page est indexée,
 * aspirée et archivée ; une coordonnée personnelle y devient permanente et
 * incontrôlable. Le nom de l'employeur suit la règle d'anonymat du reste du
 * site.
 */
export default async function CV({ params }: PageProps<"/[langue]/cv">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  const s = PAGE_CV.sections;

  return (
    <div className="mx-auto max-w-4xl px-5">
      {/* ---- Chapeau, écran seulement --------------------------------- */}
      <header className="py-16 lg:py-20 print:hidden">
        <h1 className="font-display text-titre text-texte uppercase">{t(PAGE_CV.titre, langue)}</h1>
        <p className="text-texte-attenue mt-4 max-w-2xl leading-relaxed">
          {t(PAGE_CV.chapeau, langue)}
        </p>
        <p className="text-texte-faible mt-4 max-w-2xl text-sm leading-relaxed">
          {t(PAGE_CV.absences, langue)}
        </p>
        <p className="annotation text-texte-faible mt-6 normal-case">
          {t(PAGE_CV.imprimer, langue)}
        </p>
      </header>

      {/*
        Le CV lui-même. `cv` porte la mise en page d'impression, définie une
        seule fois dans `globals.css` : la répartir en `print:` sur chaque
        élément rendrait le balisage illisible pour un gain nul.
      */}
      <article className="cv border-trait mb-20 border-y py-10 print:mb-0 print:border-0 print:py-0">
        <h2 className="sr-only">{t(PAGE_CV.version, langue)}</h2>

        {/* ---- Identité ------------------------------------------------ */}
        <header className="cv-tete">
          <p className="font-display text-texte text-2xl leading-none font-black tracking-tight uppercase">
            {SITE.nom}
          </p>
          <p className="text-texte-attenue mt-1.5 text-sm">{t(SITE.surTitre, langue)}</p>
          <ul className="text-texte-faible mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-signal">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={CONTACT.github} className="hover:text-signal">
                {CONTACT.github.replace("https://", "")}
              </a>
            </li>
            {CONTACT.linkedin && (
              <li>
                <a href={CONTACT.linkedin} className="hover:text-signal">
                  {CONTACT.linkedin.replace("https://", "")}
                </a>
              </li>
            )}
          </ul>
        </header>

        {/* ---- Profil -------------------------------------------------- */}
        <Section titre={t(PAGE_CV.profil.titre, langue)}>
          {PAGE_CV.profil.paragraphes.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue text-sm leading-relaxed ${i > 0 ? "mt-2" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
        </Section>

        {/* ---- Expérience et formation --------------------------------- */}
        {(
          [
            [t(s.experience, langue), EXPERIENCES],
            [t(s.formation, langue), FORMATION],
          ] as const
        ).map(([titre, etapes]) => (
          <Section key={titre} titre={titre}>
            <ul className="divide-trait divide-y">
              {etapes.map((e) => (
                <li key={e.titre.fr} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h4 className="text-texte text-sm font-semibold">{t(e.titre, langue)}</h4>
                    <span className="annotation text-texte-faible">{t(e.periode, langue)}</span>
                  </div>
                  <p className="text-texte-faible text-xs">{t(e.lieu, langue)}</p>
                  <p className="text-texte-attenue mt-1 text-sm leading-relaxed">
                    {t(e.description, langue)}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        ))}

        {/* ---- Compétences --------------------------------------------- */}
        <Section titre={t(s.competences, langue)}>
          <ul className="divide-trait divide-y">
            {COMPETENCES.map((g) => (
              <li key={g.famille.fr} className="py-2.5 first:pt-0 last:pb-0">
                <h4 className="text-texte text-sm font-semibold">{t(g.famille, langue)}</h4>
                <p className="text-texte-attenue mt-1 text-sm leading-relaxed">
                  {t(g.corps, langue)}
                </p>
                <p className="text-texte-faible mt-1 text-xs">
                  <span className="annotation">{t(PAGE_CV.outils, langue)}</span>{" "}
                  {ts(g.items, langue).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* ---- Réalisations -------------------------------------------- */}
        <Section titre={t(s.realisations, langue)}>
          <ul className="divide-trait divide-y">
            {TRAVAUX_TRIES.map((tr) => (
              <li key={tr.slug} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h4 className="text-texte text-sm font-semibold">{t(tr.titre, langue)}</h4>
                  <span className="annotation text-texte-faible">{tr.annee}</span>
                </div>
                <p className="text-texte-attenue mt-1 text-sm leading-relaxed">
                  {t(tr.resume, langue)}
                </p>
                {/*
                  Un seul chiffre par réalisation, le premier, qui est aussi le
                  plus parlant : c'est le format d'un CV, pas d'une étude de cas.
                  Les autres sont à un clic.
                */}
                {tr.chiffres[0] && (
                  <p className="text-texte-faible mt-1 text-xs">
                    <span className="text-texte tabulaire font-semibold">
                      {t(tr.chiffres[0].valeur, langue)}
                    </span>{" "}
                    {t(tr.chiffres[0].libelle, langue)}
                    {" · "}
                    {tr.stack.slice(0, 5).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="text-texte-faible mt-3 text-xs">{t(PAGE_CV.detail, langue)}</p>
        </Section>

        {/* Sur papier, l'adresse du site remplace les liens cliquables. */}
        <p className="text-texte-faible hidden text-xs print:mt-6 print:block">
          {SITE_URL.replace("https://", "").replace("http://", "")}
        </p>
      </article>

      <div className="border-trait border-t py-10 print:hidden">
        <p className="text-texte-attenue flex flex-wrap gap-x-6 gap-y-2">
          <Link href={lien("/parcours", langue)} className="text-signal hover:underline">
            {t({ fr: "Le parcours en détail", en: "The background in full" }, langue)} →
          </Link>
          <Link href={lien("/travaux", langue)} className="text-signal hover:underline">
            {t({ fr: "Les travaux", en: "The work" }, langue)} →
          </Link>
        </p>
      </div>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="cv-section">
      <h3 className="font-display text-texte mb-2 text-xs font-black tracking-tight uppercase">
        {titre}
      </h3>
      {children}
    </section>
  );
}
