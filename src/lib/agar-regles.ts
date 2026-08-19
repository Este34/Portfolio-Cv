/**
 * Les règles du monde d'Agar, extraites pour être partagées.
 *
 * Elles vivaient dans le composant jouable. Elles en sortent pour une raison
 * qui n'est pas cosmétique : la démonstration d'apprentissage par renforcement
 * fait jouer une politique apprise **dans le même monde**, contre la même
 * heuristique, et affiche les deux scores côte à côte. Si les deux fichiers
 * portaient chacun leur copie des constantes, la comparaison serait fausse dès
 * la première retouche, et fausse sans que rien ne casse.
 *
 * Ici, elle est vraie par construction : il n'existe qu'une définition.
 */

/** Masse au départ, joueur comme agent. */
export const MASSE_DEPART = 26;
/** Granules présents en permanence dans le monde. */
export const GRANULES = 130;
/** Rivaux pilotés par l'heuristique. */
export const RIVAUX = 9;

/** Masse gagnée en absorbant un granule. */
export const GAIN_GRANULE = 1.1;
/** Part de la masse récupérée en absorbant une cellule. */
export const GAIN_CELLULE = 0.8;

/**
 * Marge avant qu'une absorption soit permise.
 *
 * Sans elle, deux cellules quasi égales se dévorent au hasard des arrondis :
 * le résultat dépend de l'ordre de parcours du tableau, ce qui est le genre de
 * règle qu'on ne peut ni expliquer ni apprendre.
 */
export const MARGE = 1.1;

/** Vitesse d'une cellule de masse nulle, en pixels par seconde. */
export const VITESSE_BASE = 210;
/** Freinage par unité de masse. */
export const FREIN_MASSE = 0.022;

/** Distance à laquelle un rival commence à fuir plus gros que lui. */
export const PORTEE_FUITE = 190;
/** Distance à laquelle un rival commence à chasser plus petit que lui. */
export const PORTEE_CHASSE = 240;

/** Le rayon suit la racine de la masse : doubler l'aire, pas le diamètre. */
export const rayon = (masse: number) => Math.sqrt(masse) * 1.9;

/**
 * La vitesse décroît avec la masse.
 *
 * C'est la seule ligne qui fait le jeu. Grossir, c'est gagner en portée et
 * perdre en fuite, et tout l'intérêt tient dans ce compromis : sans lui, le
 * plus gros gagne mécaniquement et il n'y a plus rien à décider.
 */
export const vitesse = (masse: number) => VITESSE_BASE / (1 + masse * FREIN_MASSE);
