import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Making-of",
  description:
    "Comment ce portfolio est construit : architecture, budget de performance, arbitrages techniques et ce qui a été mesuré.",
};

const ARBITRAGES = [
  {
    titre: "Toute la direction artistique refaite après coup",
    corps:
      "La première version de ce site a été dessinée sans que personne ne la regarde : encre presque noire, une seule couleur d'accent, et un style d'étiquette en monospace capitales appliqué partout — navigation, listes de technologies, pieds de page. À cette fréquence, ce style ne renseigne plus, il crie. Le résultat était froid et vide, et la seule façon de le savoir était de le montrer. La refonte remplace l'accent unique par trois couleurs qui se relaient, rend la casse aux étiquettes, réserve le monospace aux données, et fait porter le contraste par la masse typographique plutôt que par la couleur.",
  },
  {
    titre: "Une figure qui montre le moteur, à la place d'un globe",
    corps:
      "La page d'accueil portait un globe de points et d'arcs, décoratif et assumé comme tel. Il occupait la place la plus visible du site pour ne rien démontrer. Il est remplacé par la projection du corpus vectorisé : les 53 passages que le moteur de recherche compare réellement à votre question, réduits de 384 dimensions à deux par analyse en composantes principales. La part de variance conservée est affichée, parce qu'une projection qui ne dit pas ce qu'elle perd est une illustration, pas une mesure.",
  },
  {
    titre: "Pas de Parquet pour le contenu du site",
    corps:
      "Le contenu du portfolio tient en 101 lignes et 12 kilo-octets. Un format colonnaire compressé n'y rend aucun service : il ajoute une dépendance d'écriture, une étape de build et un binaire opaque pour économiser quelques kilo-octets sur un fichier qui n'est chargé que si l'on ouvre la console. DuckDB lit donc du JSON. Parquet garde sa place là où il en a une : dans le pipeline de commerce international, sur des millions de lignes.",
  },
  {
    titre: "DuckDB servi depuis un CDN, pas depuis le dépôt",
    corps:
      "Les binaires WebAssembly de DuckDB pèsent entre 34 et 40 Mo selon la variante, et il en faut deux pour couvrir tous les navigateurs. Les verser dans le dépôt ferait 75 Mo pour une fonctionnalité facultative. Le CDN officiel du projet est la seule dépendance externe du site ; elle ne concerne que la console, et son échec est rattrapé sans casser la page.",
  },
  {
    titre: "Un autre modèle de vectorisation que celui du projet d'origine",
    corps:
      "Le moteur de recherche est le portage web de mon projet Python, qui emploie all-MiniLM-L6-v2. Ce modèle est entraîné très majoritairement sur de l'anglais. Mesuré sur ce corpus français, il rendait quatre passages sans rapport entre eux dans un intervalle de score de 0,02 : à cet écart, le classement ne veut plus rien dire. La version multilingue sépare réellement les passages. La fidélité au projet d'origine ne valait pas une recherche qui classe mal.",
  },
  {
    titre: "Les domaines dans un passage court et séparé",
    corps:
      "Poser « a-t-il travaillé sur de l'intelligence artificielle ? » ne remontait aucun projet : le texte du projet de recherche augmentée parle de vectorisation et de similarité cosinus, jamais d'« intelligence artificielle ». Ajouter les domaines au résumé n'a rien changé — la mise en commun par moyenne dilue une expression courte dans un passage long. Isolée dans une phrase brève, la même information fait passer le projet du huitième au premier rang.",
  },
];

const MESURES = [
  { valeur: "13", libelle: "pages statiques", note: "aucun rendu serveur" },
  { valeur: "1", libelle: "point serveur", note: "et il est facultatif" },
  { valeur: "23", libelle: "tests", note: "sur les vrais vecteurs du build" },
  { valeur: "12", libelle: "motifs d'anonymat", note: "vérifiés avant chaque build" },
];

export default function MakingOf() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="border-trait flex items-center justify-between border-b py-3">
        <span className="annotation">Index / 007</span>
        <span className="annotation">Making-of</span>
      </div>

      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte font-semibold">
          Comment ce site est construit
        </h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          Un portfolio qui prétend savoir faire tenir de la donnée lourde dans un navigateur doit
          pouvoir être ouvert et vérifié. Voici l&apos;architecture, le budget que je me suis fixé,
          et les arbitrages que j&apos;ai tranchés contre mon plan initial.
        </p>
      </header>

      <section aria-label="Mesures" className="border-trait border-y">
        <dl className="divide-trait grid sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
          {MESURES.map((m) => (
            <div key={m.libelle} className="border-trait border-b px-1 py-6 lg:border-b-0 lg:px-5">
              <dt className="annotation">{m.libelle}</dt>
              <dd className="font-display text-texte tabulaire mt-2 text-2xl font-semibold tracking-tight">
                {m.valeur}
              </dd>
              <p className="annotation text-texte-faible mt-1.5 normal-case">{m.note}</p>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-16 py-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <Bloc titre="Le principe">
          <p className="text-texte-attenue leading-relaxed">
            Tout le contenu est du HTML généré au build. Le site se lit intégralement sans
            JavaScript, sans WebGL et sans WebAssembly — c&apos;est la seule façon de tenir à la
            fois l&apos;accessibilité, le référencement et un premier rendu rapide.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Les moteurs viennent par-dessus, et seulement à la demande. Ouvrir la console
            télécharge DuckDB ; poser une question télécharge le modèle de vectorisation. Un
            visiteur qui vient lire trois paragraphes ne paie ni l&apos;un ni l&apos;autre.
          </p>
        </Bloc>

        <Bloc titre="Le budget">
          <p className="text-texte-attenue leading-relaxed">
            La contrainte structurante du site tient en une phrase : les moteurs ne doivent jamais
            entrer dans le lot initial. Ce n&apos;est pas une intention, c&apos;est une assertion
            vérifiée en intégration continue — le poids du premier rendu est plafonné, et le build
            échoue au-delà.
          </p>
          <ul className="border-trait divide-trait mt-5 divide-y border-y">
            {[
              ["Étage 0 — immédiat", "HTML, CSS, police, portrait. Le site complet."],
              ["Étage 1 — à la demande", "DuckDB-WASM, à l'ouverture de la console."],
              ["Étage 2 — à la demande", "Modèle de vectorisation, à la première question."],
            ].map(([t, d]) => (
              <li key={t} className="py-3">
                <p className="annotation">{t}</p>
                <p className="text-texte-attenue mt-1 text-sm">{d}</p>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc titre="Arbitrages">
          <ol className="divide-trait divide-y">
            {ARBITRAGES.map((a, i) => (
              <li key={a.titre} className="py-6 first:pt-0 last:pb-0">
                <span className="annotation">Arbitrage {String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-texte mt-2 text-lg font-semibold tracking-tight">
                  {a.titre}
                </h3>
                <p className="text-texte-attenue mt-2 leading-relaxed">{a.corps}</p>
              </li>
            ))}
          </ol>
        </Bloc>

        <Bloc titre="Ce qui est vérifié">
          <p className="text-texte-attenue leading-relaxed">
            Les tests portent sur ce qui casse en silence. Que le binaire des vecteurs corresponde
            aux métadonnées. Que le modèle inscrit dans le corpus soit celui que le navigateur
            chargera — sinon questions et passages vivraient dans deux espaces différents et la
            similarité ne mesurerait plus rien. Que les extraits affichés soient bien ceux qui ont
            été vectorisés. Qu&apos;aucune source ne monopolise un classement.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Et une vérification qui n&apos;est pas technique : un script relit tout ce qui part en
            ligne contre douze motifs interdits, pour que les travaux menés en alternance restent
            anonymes. Il tourne avant le build, et son échec arrête tout.
          </p>
        </Bloc>
      </div>

      <div className="border-trait border-t py-10">
        <p className="text-texte-attenue">
          Le détail des projets se lit dans les{" "}
          <Link href="/travaux" className="text-signal hover:underline">
            travaux
          </Link>
          , et la façon dont je travaille dans la{" "}
          <Link href="/methode" className="text-signal hover:underline">
            méthode
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="font-display text-texte h-fit text-sm font-semibold tracking-widest uppercase lg:sticky lg:top-20">
        {titre}
      </h2>
      <div className="lg:pb-4">{children}</div>
    </>
  );
}
