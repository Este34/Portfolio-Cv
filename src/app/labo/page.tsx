import type { Metadata } from "next";

import { Agar } from "@/components/labo/agar";
import { Boids } from "@/components/labo/boids";
import { KMeans } from "@/components/labo/kmeans";
import { Reseau } from "@/components/labo/reseau";

export const metadata: Metadata = {
  title: "Labo",
  description:
    "Simulations interactives : rétropropagation écrite à la main, comportements émergents, k-moyennes itératif, systèmes temps réel jouables.",
};

const DEMOS = [
  {
    id: "reseau",
    titre: "Un réseau qui apprend",
    sousTitre: "Rétropropagation écrite à la main, sans bibliothèque",
    corps: [
      "Deux spirales entrelacées. J'ai mesuré ce qu'obtient le meilleur demi-plan possible sur ces données, par balayage exhaustif des orientations et des seuils : 75 % de justesse, et il ne fera jamais mieux. Le réseau — deux entrées, deux couches cachées de douze neurones, une sortie — les sépare intégralement en quelques secondes, après moins d'un millier de mini-lots. La frontière de décision se forme sous vos yeux, et l'apprentissage repart de zéro peu après avoir convergé : vous voyez donc le cycle complet, quel que soit le moment où vous arrivez.",
      "Passe avant, passe arrière, descente de gradient sur mini-lots : tout est écrit à la main, en une centaine de lignes, sans TensorFlow ni PyTorch. C'est le même parti pris que mon projet de recherche augmentée — on ne comprend un mécanisme qu'en l'implémentant, et l'entropie croisée binaire combinée à une sigmoïde donne directement la dérivée de sortie, sans passer par la dérivée de l'activation.",
      "Basculez sur « Dessiner » et posez vos propres points : vous choisissez la couleur, vous cliquez dans le cadre, et la frontière s'adapte à ce que vous venez de tracer. C'est là qu'on apprend le plus. Un seul point mal placé déforme toute une frontière. Le réseau extrapole n'importe quoi là où vous ne lui avez rien montré. Deux amas bien séparés sont résolus instantanément, deux amas imbriqués lui résistent.",
      "Le bogue qui m'a coûté le plus de temps ici n'était ni dans les gradients ni dans l'architecture : les points étaient générés classe par classe, et un parcours séquentiel produisait des mini-lots presque mono-classe. Le réseau apprenait alternativement « tout est 0 » puis « tout est 1 » et s'effondrait à 50 %. Un mélange de Fisher-Yates a suffi. C'est le genre de défaut qu'aucune relecture ne montre et qu'une mesure trouve en dix minutes.",
    ],
    composant: <Reseau />,
  },
  {
    id: "nuee",
    titre: "Nuée",
    sousTitre: "Comportement émergent à partir de trois règles locales",
    corps: [
      "Séparation, alignement, cohésion. Chaque individu ne perçoit que ses voisins immédiats et n'a aucune idée de la forme du groupe — celle-ci n'est écrite nulle part, elle apparaît.",
      "C'est le contre-exemple le plus court à l'intuition qu'un comportement collectif lisible demande une coordination centrale. Le curseur fait office de prédateur.",
      "La couleur n'indique pas la vitesse mais le nombre de voisins perçus : un individu passe au citron dès qu'il en compte quatre. On voit ainsi les agrégats se former et se défaire — ce qui est précisément la grandeur que la démonstration prétend illustrer.",
    ],
    composant: <Boids />,
  },
  {
    id: "k-moyennes",
    titre: "k-moyennes",
    sousTitre: "La convergence, montrée itération par itération",
    corps: [
      "L'algorithme de Lloyd tient en deux gestes répétés : affecter chaque point au centre le plus proche, puis déplacer chaque centre au barycentre de ce qu'il a récolté. La démonstration les exécute lentement et affiche l'inertie, pour donner à voir la convergence plutôt que son résultat.",
      "L'initialisation est volontairement naïve — des points tirés au hasard. C'est elle qui rend visible le minimum local que k-means++ existe pour éviter. Cliquez pour ajouter un point : un seul, mal placé, suffit parfois à déplacer une frontière.",
    ],
    composant: <KMeans />,
  },
  {
    id: "agar",
    titre: "Agar",
    sousTitre: "Un système jouable, tenu par un seul compromis",
    corps: [
      "Reprise de mon dépôt `agar`, porté en canvas. La cellule suit le curseur, absorbe ce qui est plus petit qu'elle, se fait absorber par le reste.",
      "Toute la tension du jeu tient dans une ligne de code : la vitesse décroît avec la masse. Grossir, c'est gagner en portée et perdre en fuite. Sans ce compromis, il n'y a plus de partie — seulement une courbe croissante.",
    ],
    composant: <Agar />,
  },
];

export default function Labo() {
  return (
    <div className="mx-auto max-w-6xl px-5">
      <header className="py-16 lg:py-20">
        <h1 className="font-display text-titre text-texte uppercase">Labo</h1>
        <p className="text-texte-attenue mt-4 max-w-2xl text-lg leading-relaxed">
          Des systèmes qu&apos;on ne comprend qu&apos;en les faisant tourner. Tout ce qui suit
          s&apos;exécute dans votre navigateur, en canvas, sans bibliothèque : quelques centaines de
          lignes chacun, et rien de pré-calculé.
        </p>
        <p className="annotation text-texte-faible mt-6 normal-case">
          Les simulations se mettent en pause dès qu&apos;elles sortent du champ, et restent fixes
          si votre système demande à réduire les animations.
        </p>
      </header>

      <div className="divide-trait divide-y pb-20">
        {DEMOS.map((demo, i) => (
          <section key={demo.id} id={demo.id} className="scroll-mt-20 py-14 first:pt-0">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.55fr] lg:gap-14">
              <div>
                <span className="annotation">Démonstration {String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-texte mt-2 text-2xl uppercase">
                  {demo.titre}
                </h2>
                <p className="text-texte-attenue mt-1 text-sm">{demo.sousTitre}</p>
                {demo.corps.map((p) => (
                  <p key={p.slice(0, 40)} className="text-texte-attenue mt-4 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              <div>{demo.composant}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
