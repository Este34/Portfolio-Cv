import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Banc } from "@/components/evaluation/banc";
import { FondAnime } from "@/components/fond/fond-anime";
import { EVALUATIONS } from "@/content/evaluations";
import { PAGE_EVALUATIONS } from "@/content/pages";
import { reussi, type Evaluation } from "@/lib/evaluation";
import { estLangue, locale, t, type Langue } from "@/lib/langue";
import { metadonnees } from "@/lib/metadonnees";

export async function generateMetadata({
  params,
}: PageProps<"/[langue]/evaluations">): Promise<Metadata> {
  const { langue } = await params;
  if (!estLangue(langue)) return {};
  return metadonnees({
    langue,
    chemin: "/evaluations",
    titre: t(PAGE_EVALUATIONS.meta.titre, langue),
    description: t(PAGE_EVALUATIONS.meta.description, langue),
  });
}

/**
 * Les résultats sont lus depuis l'artefact, pas recalculés au rendu.
 *
 * Vectoriser dix-huit questions demande le modèle, donc plusieurs dizaines de
 * méga-octets et quelques secondes : le faire pendant le rendu de la page
 * ferait payer à chaque construction ce qui ne change qu'avec le corpus.
 * L'artefact est produit par `npm run evaluer:rag` et versionné.
 */
async function lireEvaluation(langue: Langue): Promise<Evaluation> {
  const chemin = join(process.cwd(), "public", "data", `evaluation-${langue}.json`);
  return JSON.parse(await readFile(chemin, "utf8")) as Evaluation;
}

export default async function Evaluations({ params }: PageProps<"/[langue]/evaluations">) {
  const { langue } = await params;
  if (!estLangue(langue)) notFound();

  const evaluation = await lireEvaluation(langue);
  const { bilan, courbe, cas } = evaluation;

  const pc = (v: number) => `${Math.round(v * 100)}${langue === "fr" ? " %" : "%"}`;
  const nb = (v: number) => v.toLocaleString(locale(langue), { maximumFractionDigits: 2 });

  const chiffres = [
    { libelle: { fr: "Rappel@4", en: "Recall@4" }, valeur: pc(bilan.rappel) },
    { libelle: { fr: "Rang réciproque moyen", en: "Mean reciprocal rank" }, valeur: nb(bilan.mrr) },
    { libelle: { fr: "Précision@4", en: "Precision@4" }, valeur: pc(bilan.precision) },
    { libelle: { fr: "Silence", en: "Silence" }, valeur: pc(bilan.silence) },
  ];

  const casParId = new Map(cas.map((c) => [c.id, c]));
  const echecs = cas.filter((c) => !reussi(c));

  return (
    <div className="mx-auto max-w-6xl px-5">
      <FondAnime motif="trame" intensite={0.3} />

      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">
          {t(PAGE_EVALUATIONS.titre, langue)}
        </h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          {t(PAGE_EVALUATIONS.chapeau, langue)}
        </p>
        <p className="annotation text-texte-faible mt-6 normal-case">
          {evaluation.modele} · {evaluation.passages}{" "}
          {langue === "fr" ? "passages vectorisés" : "embedded passages"} ·{" "}
          {langue === "fr" ? "seuil" : "threshold"} {nb(evaluation.seuil)}
        </p>
      </header>

      <section
        aria-label={t(PAGE_EVALUATIONS.mesures.titre, langue)}
        className="border-trait border-y"
      >
        <dl className="divide-trait grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
          {chiffres.map((c) => (
            <div key={c.libelle.fr} className="border-trait border-b px-1 py-6 lg:border-b-0 lg:px-5">
              <dt className="annotation">{t(c.libelle, langue)}</dt>
              <dd className="mt-2">
                <span className="font-display text-texte tabulaire block text-2xl uppercase">
                  {c.valeur}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-16 py-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <Bloc titre={t(PAGE_EVALUATIONS.pourquoi.titre, langue)}>
          {PAGE_EVALUATIONS.pourquoi.paragraphes.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}
        </Bloc>

        <Bloc titre={t(PAGE_EVALUATIONS.mesures.titre, langue)}>
          <p className="text-texte-attenue leading-relaxed">
            {t(PAGE_EVALUATIONS.mesures.chapeau, langue)}
          </p>
          <ul className="border-trait divide-trait mt-5 divide-y border-y">
            {PAGE_EVALUATIONS.mesures.etages.map((e) => (
              <li key={e.titre.fr} className="py-3">
                <p className="annotation">{t(e.titre, langue)}</p>
                <p className="text-texte-attenue mt-1 text-sm leading-relaxed">{t(e.corps, langue)}</p>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc titre={t(PAGE_EVALUATIONS.seuil.titre, langue)}>
          {PAGE_EVALUATIONS.seuil.paragraphes.map((p, i) => (
            <p
              key={p.fr.slice(0, 32)}
              className={`text-texte-attenue leading-relaxed ${i > 0 ? "mt-4" : ""}`}
            >
              {t(p, langue)}
            </p>
          ))}

          {/*
            La courbe est une table, pas un graphique.

            Quatre colonnes et huit lignes se lisent plus vite qu'un tracé, se
            citent, et restent accessibles à un lecteur d'écran sans description
            alternative à écrire. Un graphique n'aurait servi qu'à faire joli.
          */}
          <div className="border-trait rounded-instrument mt-5 overflow-x-auto border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t(PAGE_EVALUATIONS.seuil.titre, langue)}</caption>
              <thead className="border-trait bg-surface border-b">
                <tr>
                  {[
                    { fr: "Seuil", en: "Threshold" },
                    { fr: "Rappel", en: "Recall" },
                    { fr: "Silence", en: "Silence" },
                    { fr: "Précision", en: "Precision" },
                  ].map((c) => (
                    <th key={c.fr} scope="col" className="annotation px-3 py-2">
                      {t(c, langue)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-trait divide-y">
                {courbe.map((p) => {
                  const retenu = Math.abs(p.seuil - evaluation.seuil) < 1e-9;
                  return (
                    <tr key={p.seuil} className={retenu ? "bg-signal-voile" : ""}>
                      <th
                        scope="row"
                        className={`tabulaire px-3 py-1.5 text-left font-mono text-xs font-medium ${
                          retenu ? "text-signal" : "text-texte-attenue"
                        }`}
                      >
                        {nb(p.seuil)}
                        {retenu && <span className="ml-2">←</span>}
                      </th>
                      <td className="text-texte-attenue tabulaire px-3 py-1.5 font-mono text-xs">
                        {pc(p.rappel)}
                      </td>
                      <td className="text-texte-attenue tabulaire px-3 py-1.5 font-mono text-xs">
                        {pc(p.silence)}
                      </td>
                      <td className="text-texte-attenue tabulaire px-3 py-1.5 font-mono text-xs">
                        {pc(p.precision)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Bloc>

        <Bloc titre={t(PAGE_EVALUATIONS.refaire.titre, langue)}>
          <p className="text-texte-attenue mb-5 leading-relaxed">
            {t(PAGE_EVALUATIONS.refaire.corps, langue)}
          </p>
          <Banc langue={langue} publie={bilan} />
        </Bloc>
      </div>

      {/* ---- Les cas, un par un ------------------------------------------ */}
      <section className="border-trait border-t py-16">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-titre text-texte uppercase">
            {langue === "fr" ? "Les dix-huit cas" : "The eighteen cases"}
          </h2>
          <span className="annotation shrink-0">
            {echecs.length}{" "}
            {langue === "fr"
              ? `échec${echecs.length > 1 ? "s" : ""}`
              : `failure${echecs.length > 1 ? "s" : ""}`}
          </span>
        </div>

        <ol className="divide-trait border-trait divide-y border-y">
          {EVALUATIONS.map((definition, i) => {
            const resultat = casParId.get(definition.id);
            if (!resultat) return null;
            const ok = reussi(resultat);
            const horsCorpus = definition.attendus.length === 0;

            return (
              <li key={definition.id} className="py-5">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="annotation shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span
                        className={`annotation shrink-0 ${ok ? "text-texte-faible" : "text-signal"}`}
                      >
                        {ok
                          ? langue === "fr"
                            ? "trouvé"
                            : "found"
                          : langue === "fr"
                            ? "raté"
                            : "missed"}
                      </span>
                      {horsCorpus && (
                        <span className="annotation text-texte-faible shrink-0">
                          {langue === "fr" ? "hors corpus" : "out of corpus"}
                        </span>
                      )}
                    </div>
                    <p className="text-texte mt-1.5 leading-relaxed">
                      {t(definition.question, langue)}
                    </p>
                    <p className="text-texte-faible mt-1.5 text-sm leading-relaxed">
                      {t(definition.intention, langue)}
                    </p>
                  </div>

                  <div>
                    {resultat.rendus.length === 0 ? (
                      <p className="annotation text-texte-faible normal-case">
                        {langue === "fr" ? "aucun passage cité" : "no passage cited"}
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {resultat.rendus.map((r, rang) => (
                          <li key={r.id} className="flex items-baseline gap-2 text-xs">
                            <span
                              className={`annotation shrink-0 ${
                                r.attendu ? "text-citron" : "text-texte-faible"
                              }`}
                            >
                              {rang + 1}
                            </span>
                            <span
                              className={`font-mono break-all ${
                                r.attendu ? "text-texte" : "text-texte-faible"
                              }`}
                            >
                              {r.id}
                            </span>
                            <span className="annotation text-texte-faible ml-auto shrink-0">
                              {nb(r.score)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {resultat.manques.length > 0 && (
                      <p className="text-texte-faible mt-2 font-mono text-xs break-all">
                        {langue === "fr" ? "manqué : " : "missed: "}
                        {resultat.manques.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <>
      {/* Voir la note dans `making-of/page.tsx` sur l'enveloppe des titres collants. */}
      <div>
        <h2 className="font-display text-texte h-fit text-sm font-black tracking-tight uppercase lg:sticky lg:top-20">
          {titre}
        </h2>
      </div>
      <div className="lg:pb-4">{children}</div>
    </>
  );
}
