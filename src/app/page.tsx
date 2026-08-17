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

      {/* ---- Le récit ------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
          <div>
            <p className="annotation text-corail">Comment j&apos;y suis arrivé</p>
            <h2 className="text-titre text-texte mt-2 uppercase">
              Des sciences cognitives à la donnée
            </h2>
          </div>

          {/*
            Écrit à la première personne et au passé, parce qu'un portfolio qui
            n'énumère que des compétences ne dit pas pourquoi la personne les a
            acquises. Chaque paragraphe est vérifiable : diplôme, sélection,
            alternance, chiffres.
          */}
          <div className="flex flex-col gap-4">
            <p className="text-texte-attenue leading-relaxed">
              J&apos;ai commencé par les sciences cognitives : comprendre comment on perçoit,
              comment on décide, comment on se trompe. Une licence de mathématiques et
              d&apos;informatique appliquées aux sciences humaines, à Montpellier, où j&apos;ai passé
              plus de temps sur les données que sur les théories.
            </p>

            <p className="text-texte-attenue leading-relaxed">
              En 2023, le Parlement européen m&apos;a retenu parmi cent citoyens pour formuler des
              recommandations sur la mobilité d&apos;apprentissage. J&apos;y ai été rapporteur
              d&apos;un groupe de travail : synthétiser des positions qui ne s&apos;accordaient pas,
              puis les défendre en plénière. C&apos;est là que j&apos;ai compris qu&apos;un travail
              n&apos;existe vraiment que lorsqu&apos;il devient lisible par ceux qui ne l&apos;ont
              pas fait.
            </p>

            <p className="text-texte-attenue leading-relaxed">
              Depuis juin 2026, je suis en alternance dans un institut de recherche public. On
              m&apos;y a confié des modèles de prospective sur l&apos;énergie, la mobilité,
              l&apos;agriculture et le numérique, enfermés dans des classeurs de plusieurs dizaines
              de feuilles. Consulter un scénario supposait la bonne version du fichier, la bonne
              licence, et de savoir rejouer des macros. Les résultats circulaient en captures
              d&apos;écran.
            </p>

            <p className="text-texte-attenue leading-relaxed">
              J&apos;en ai fait quatre applications qu&apos;on ouvre dans un navigateur. Et parce
              qu&apos;un simulateur qui diverge de son classeur crée deux vérités au lieu
              d&apos;une, j&apos;ai écrit le garde-fou avant l&apos;interface : le générateur rejoue
              les trajectoires de référence et refuse de produire les données au-delà de{" "}
              <strong className="text-texte font-semibold">0,1 % d&apos;écart</strong>.
            </p>

            <p className="text-texte-attenue leading-relaxed">
              À la rentrée 2026, j&apos;entre en master d&apos;ingénierie de l&apos;intelligence
              artificielle à Paris 8, tout en poursuivant l&apos;alternance. Ce que je cherche
              n&apos;a pas changé depuis les sciences cognitives : rendre manipulable ce qui sert à
              décider.
            </p>

            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                href="/parcours"
                className="border-trait-fort text-texte hover:bloc-citron border-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors"
              >
                Le parcours en détail
              </Link>
              <Link
                href="/methode"
                className="border-trait-fort text-texte hover:bloc-citron border-2 px-5 py-2.5 text-sm font-bold uppercase transition-colors"
              >
                Comment je travaille
              </Link>
            </div>
          </div>
        </div>
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
