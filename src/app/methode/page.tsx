import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Méthode",
  description:
    "Comment je travaille avec des agents de code : ce que je leur délègue, ce que je garde, et comment je vérifie.",
};

/**
 * ⚠️ BROUILLON À VALIDER PAR ESTEBAN.
 *
 * Cette page parle à la première personne d'une pratique de travail. Le texte
 * a été écrit à partir de ce que montrent les dépôts (scripts de vérification,
 * conventions de modèle documentées, historique des commits), mais chaque
 * affirmation doit être relue et assumée avant mise en ligne.
 */
export default function Methode() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <div className="border-trait flex items-center justify-between border-b py-3">
        <span className="annotation">Index / 003</span>
        <span className="annotation">Méthode</span>
      </div>

      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte font-semibold">
          J&apos;écris du code avec des agents. Voici où passe la frontière.
        </h1>
        <p className="text-texte-attenue mt-6 max-w-2xl text-lg leading-relaxed">
          L&apos;historique de mes dépôts le montre sans détour : une partie du code a été produite
          avec un agent. Plutôt que de le taire, autant expliquer comment — parce que c&apos;est la
          répartition des rôles qui décide de la qualité du résultat, pas l&apos;outil.
        </p>
      </header>

      <div className="grid gap-16 pb-20 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <Bloc titre="Ce que je délègue">
          <p className="text-texte-attenue leading-relaxed">
            Le volume et la répétition. Porter 106 lignes d&apos;un tableau d&apos;experts dans une
            structure de données, écrire le septième composant de graphe sur le même patron, dérouler
            un refactor mécanique à travers neuf modules, produire un premier jet de documentation à
            partir du code.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Ce sont des tâches où l&apos;erreur est visible et le coût de vérification faible. C&apos;est
            exactement là qu&apos;un agent est rentable.
          </p>
        </Bloc>

        <Bloc titre="Ce que je ne délègue pas">
          <ul className="divide-trait divide-y">
            {[
              {
                titre: "La définition de ce qui est juste",
                corps:
                  "Décider qu'un champ vide signifie « suivre le tendanciel » et non « zéro » n'est pas une question de code : c'est une lecture du modèle métier. Se tromper là produit un logiciel qui fonctionne parfaitement et répond faux.",
              },
              {
                titre: "Le choix des invariants à vérifier",
                corps:
                  "Un agent écrit volontiers le test qu'on lui demande. Savoir que le test qui compte est la comparaison feuille à feuille avec le classeur d'origine — et fixer le seuil d'échec à 0,1 % — relève du jugement, pas de la génération.",
              },
              {
                titre: "Les arbitrages contraints",
                corps:
                  "Renoncer à un bundler parce que le livrable doit s'ouvrir hors ligne depuis une pièce jointe : c'est une décision qui vient du terrain, pas des bonnes pratiques générales.",
              },
              {
                titre: "La relecture ligne à ligne de ce qui part en production",
                corps:
                  "Je ne valide pas un diff que je ne saurais pas défendre. Si je ne peux pas expliquer pourquoi une ligne est là, elle n'y reste pas.",
              },
            ].map((item) => (
              <li key={item.titre} className="py-6 first:pt-0 last:pb-0">
                <h3 className="font-display text-texte text-lg font-semibold tracking-tight">
                  {item.titre}
                </h3>
                <p className="text-texte-attenue mt-2 leading-relaxed">{item.corps}</p>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc titre="Comment je vérifie">
          <p className="text-texte-attenue leading-relaxed">
            La question posée à un agent n&apos;est jamais « est-ce que ça marche ? », mais « comment
            saurai-je que ça a cessé de marcher ? ». Sur les simulateurs, la réponse tient dans le
            générateur de données : il rejoue les trajectoires de référence avec le modèle porté en
            JavaScript, les compare aux sorties du classeur, et refuse de produire le jeu de données
            au-delà de 0,1 % d&apos;écart.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            C&apos;est ce garde-fou, et pas la revue de code, qui garantit que le simulateur et le
            classeur ne diront jamais deux choses différentes. Écart constaté en pratique :{" "}
            <strong className="text-signal font-semibold">2·10⁻⁵ %</strong>.
          </p>
        </Bloc>

        <Bloc titre="Pourquoi le dire">
          <p className="text-texte-attenue leading-relaxed">
            Parce que la compétence a changé de place. Produire du code n&apos;est plus le goulet
            d&apos;étranglement ; savoir ce qu&apos;il faut produire, comment le contraindre et à
            quoi le confronter, si.
          </p>
          <p className="text-texte-attenue mt-4 leading-relaxed">
            Un portfolio qui masquerait cette part du travail décrirait un métier qui n&apos;existe
            plus tout à fait.
          </p>
        </Bloc>
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
