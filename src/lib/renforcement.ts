/**
 * Apprentissage par renforcement, écrit à la main, dans le navigateur.
 *
 * Le réseau du labo apprend une **frontière** : on lui montre la bonne réponse
 * pour chaque point, il ajuste. Ici, personne ne connaît la bonne réponse. Il
 * n'existe qu'une récompense qui arrive après coup, et le problème est
 * d'attribuer le mérite d'un gain à une décision prise trois secondes plus tôt.
 *
 * C'est la différence entre apprendre à classer et apprendre à **agir**, et
 * c'est le seul endroit du site où l'on voit un modèle être franchement mauvais
 * avant de devenir passable.
 *
 * ## L'algorithme
 *
 * REINFORCE avec ligne de base, c'est-à-dire le gradient de politique dans sa
 * forme la plus dépouillée. La politique est un réseau qui, pour un état, sort
 * une distribution sur huit directions. On joue des épisodes en tirant l'action
 * dans cette distribution, puis on pousse la probabilité des actions qui ont
 * mieux réussi que la moyenne et on réduit celle des autres :
 *
 *     ∇ = Σ_t  ∇ log π(a_t | s_t) · A_t
 *
 * Le terme `A_t` est le retour actualisé à partir de `t`, centré et réduit sur
 * le lot. Sans ce centrage, tous les retours d'un jeu où l'on ne fait que
 * gagner de la masse sont positifs : chaque action est renforcée, y compris les
 * mauvaises, et le réseau n'apprend qu'à faire n'importe quoi avec assurance.
 *
 * ## Ce module ne rend rien
 *
 * Comme `mlp.ts`, et pour la même raison : c'est ce qui permet de vérifier en
 * Node que la politique apprend réellement. Un signe inversé dans le gradient
 * donne un agent qui bouge, qui a l'air de chercher, et qui devient
 * lentement pire. Aucun œil ne voit ça sur une animation ; une mesure contre
 * une politique aléatoire le voit en dix secondes.
 */

import {
  GAIN_CELLULE,
  GAIN_GRANULE,
  GRANULES,
  MARGE,
  PORTEE_CHASSE,
  PORTEE_FUITE,
  RIVAUX,
  rayon,
  vitesse,
} from "./agar-regles.ts";
import { creerAlea } from "./mlp.ts";

/* -------------------------------------------------------------------------- */
/* Réglages                                                                    */
/* -------------------------------------------------------------------------- */

/** Dimensions de l'état perçu. Voir `observer`. */
export const ENTREES = 12;
/** Directions possibles : la rose des vents à huit branches. */
export const ACTIONS = 8;
/** Neurones par couche cachée. */
export const CACHE = 16;

/** Pas de temps de la simulation d'entraînement, en secondes. */
export const DT = 1 / 20;
/** Durée maximale d'un épisode, en pas. 400 pas font vingt secondes de jeu. */
export const PAS_MAX = 400;

/**
 * Masse de départ de l'agent, et c'est le seul réglage qui s'écarte du jeu.
 *
 * Le joueur humain commence à 26, contre des rivaux tirés entre 12 et 58. Cela
 * fait 5,8 menaces sur 9 dès la première image, et le résultat est sans appel :
 * mesuré sur 300 mondes, l'heuristique du jeu survit 2,4 s et le hasard 0,8 s.
 * Aucune des deux ne finit jamais un épisode. Un environnement où même la
 * meilleure politique connue meurt en deux secondes n'apprend rien à personne :
 * la récompense arrive trop tôt pour qu'aucune décision en soit responsable.
 *
 * Balayage de la masse de départ, heuristique contre hasard, 250 mondes :
 *
 *   26 → 5,8 menaces   heuristique 2,4 s ( 0 % de survie)   hasard 0,8 s   ×3,0
 *   35 → 3,8 menaces   heuristique 4,0 s ( 2 %)             hasard 1,2 s   ×3,3
 *   45 → 1,7 menaces   heuristique 7,6 s (18 %)             hasard 1,9 s   ×4,0  ← retenu
 *   55 → 0   menaces   heuristique 14,9 s (58 %)            hasard 4,3 s   ×3,5
 *   65 → 0   menaces   heuristique 19,5 s (96 %)            hasard 9,3 s   ×2,1
 *
 * 45 est le point où l'écart entre les deux étalons est le plus large sans que
 * le plafond sature. L'agent y est encore proie de deux rivaux en moyenne et
 * prédateur des sept autres : les deux moitiés de l'état perçu servent.
 */
export const MASSE_DEPART_AGENT = 45;

/**
 * Actualisation.
 *
 * À vingt pas par seconde, 0,99 donne une demi-vie d'environ soixante-dix pas,
 * soit trois secondes et demie. C'est l'ordre de grandeur du délai entre la
 * décision de foncer vers un granule et le fait de l'atteindre.
 */
export const GAMMA = 0.99;
/** Taux d'apprentissage. */
export const PAS_APPRENTISSAGE = 0.05;
/** Épisodes accumulés avant d'appliquer un gradient. */
export const LOT_EPISODES = 8;

/**
 * Prime d'entropie : la politique est payée pour rester indécise.
 *
 * C'est le réglage qui décide si cette démonstration marche, et il n'a rien
 * d'évident. Sans prime, la distribution s'effondre : mesurée sur une politique
 * entraînée 4 000 épisodes, son entropie tombe à 0,002 sur un maximum de
 * ln 8 ≈ 2,08. Autrement dit elle finit certaine de son choix partout, cesse
 * d'explorer, et se fige sur ce qu'elle avait trouvé au millier d'épisodes.
 *
 * Balayage, courbe de survie relevée tous les 1 000 épisodes :
 *
 *   0,01 → 5,7  8,0  4,7  3,4  5,3   entropie finale 1,05   (monte puis retombe)
 *   0,03 → 3,5  6,5  5,9  8,1  7,0   entropie finale 1,59
 *   0,08 → 6,8  9,8  9,2 10,8  9,0   entropie finale 1,83   ← retenu
 *   0,20 → 4,5 11,3  4,6  9,0  6,4   entropie finale 2,04   (ne se décide jamais)
 *
 * À 0,08 la courbe monte et **tient**. Plus bas elle s'effondre, plus haut la
 * prime domine la récompense et l'agent joue presque au hasard, avec des pics
 * qui ne sont que du bruit.
 */
export const ENTROPIE = 0.08;

/** Les huit directions, en vecteurs unitaires. */
export const DIRECTIONS: readonly (readonly [number, number])[] = Array.from(
  { length: ACTIONS },
  (_, k) => {
    const a = (k / ACTIONS) * Math.PI * 2;
    return [Math.cos(a), Math.sin(a)] as const;
  },
);

/* -------------------------------------------------------------------------- */
/* Le monde                                                                    */
/* -------------------------------------------------------------------------- */

export type Cellule = { x: number; y: number; masse: number };
export type Granule = { x: number; y: number };

export type Monde = {
  largeur: number;
  hauteur: number;
  agent: Cellule;
  rivaux: Cellule[];
  granules: Granule[];
  pas: number;
  /** Vrai dès que l'agent a été absorbé. */
  mort: boolean;
  alea: () => number;
};

export function creerMonde(alea: () => number, largeur = 640, hauteur = 400): Monde {
  const monde: Monde = {
    largeur,
    hauteur,
    agent: { x: largeur / 2, y: hauteur / 2, masse: MASSE_DEPART_AGENT },
    rivaux: [],
    granules: [],
    pas: 0,
    mort: false,
    alea,
  };
  for (let i = 0; i < RIVAUX; i++) {
    monde.rivaux.push({
      x: alea() * largeur,
      y: alea() * hauteur,
      masse: 12 + alea() * 46,
    });
  }
  for (let i = 0; i < GRANULES; i++) {
    monde.granules.push({ x: alea() * largeur, y: alea() * hauteur });
  }
  return monde;
}

/** Déplace une cellule dans une direction unitaire, à la vitesse que sa masse permet. */
function deplacer(m: Monde, c: Cellule, dx: number, dy: number, dt: number) {
  const v = vitesse(c.masse);
  c.x = Math.min(m.largeur, Math.max(0, c.x + dx * v * dt));
  c.y = Math.min(m.hauteur, Math.max(0, c.y + dy * v * dt));
}

/** Déplace une cellule vers un point. */
function vers(m: Monde, c: Cellule, cx: number, cy: number, dt: number) {
  const dx = cx - c.x;
  const dy = cy - c.y;
  const d = Math.hypot(dx, dy) || 1;
  deplacer(m, c, dx / d, dy / d, dt);
}

type Voisin = { dx: number; dy: number; d: number } | null;

/** Le plus proche d'un ensemble, en coordonnées relatives au point de vue. */
function plusProche<T extends { x: number; y: number }>(
  cx: number,
  cy: number,
  points: readonly T[],
  garder: (p: T) => boolean = () => true,
): Voisin {
  let meilleur: Voisin = null;
  let min = Infinity;
  for (const p of points) {
    if (!garder(p)) continue;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < min) {
      min = d2;
      const d = Math.sqrt(d2) || 1e-6;
      meilleur = { dx: dx / d, dy: dy / d, d };
    }
  }
  return meilleur;
}

/** Portée au-delà de laquelle un objet est traité comme absent. */
const PORTEE_VUE = 320;

/**
 * L'état perçu par l'agent : douze nombres, tous égocentrés.
 *
 * Trois cibles, trois nombres chacune — la direction en vecteur unitaire, et
 * une proximité qui vaut 1 au contact et 0 au-delà de la portée de vue :
 *
 *  - le granule le plus proche,
 *  - la menace la plus proche, c'est-à-dire un rival capable de l'absorber,
 *  - la proie la plus proche.
 *
 * Puis sa propre masse, et sa position dans le cadre — les deux seules
 * grandeurs non relatives, parce qu'un agent qui ignore où sont les murs passe
 * son temps à pousser contre eux.
 *
 * Le choix d'un état égocentré n'est pas un détail : il rend la politique
 * invariante par translation, donc apprenable avec quelques centaines de
 * paramètres. Nourrie de coordonnées absolues, elle devrait réapprendre la même
 * chose dans chaque coin du cadre.
 */
export function observer(m: Monde, sortie = new Float64Array(ENTREES)): Float64Array {
  const a = m.agent;

  const granule = plusProche(a.x, a.y, m.granules);
  const menace = plusProche<Cellule>(
    a.x,
    a.y,
    m.rivaux,
    (r: Cellule) => r.masse > a.masse * MARGE,
  );
  const proie = plusProche<Cellule>(a.x, a.y, m.rivaux, (r: Cellule) => a.masse > r.masse * MARGE);

  const poser = (i: number, v: Voisin) => {
    if (!v) {
      sortie[i] = 0;
      sortie[i + 1] = 0;
      sortie[i + 2] = 0;
      return;
    }
    const proximite = Math.max(0, 1 - v.d / PORTEE_VUE);
    sortie[i] = v.dx * proximite;
    sortie[i + 1] = v.dy * proximite;
    sortie[i + 2] = proximite;
  };

  poser(0, granule);
  poser(3, menace);
  poser(6, proie);

  sortie[9] = Math.tanh(a.masse / 60);
  sortie[10] = (a.x / m.largeur) * 2 - 1;
  sortie[11] = (a.y / m.hauteur) * 2 - 1;

  return sortie;
}

/**
 * L'heuristique, reprise mot pour mot du jeu.
 *
 * C'est exactement la règle qui pilote les rivaux dans la version jouable :
 * fuir plus gros, chasser plus petit, sinon rejoindre le granule le plus
 * proche. Elle sert d'étalon, et elle est meilleure que ce qu'on croit — elle
 * ne se trompe jamais de cible, ne perd jamais de temps, et n'a coûté que six
 * lignes à écrire.
 *
 * Elle est contrainte aux **mêmes huit directions** que la politique apprise.
 * Sans cette contrainte, elle jouerait en continu contre un adversaire
 * discrétisé, et l'écart mesuré ne dirait plus rien de l'apprentissage.
 */
export function heuristique(m: Monde): number {
  const a = m.agent;
  let cibleX = 0;
  let cibleY = 0;

  const menace = plusProche<Cellule>(
    a.x,
    a.y,
    m.rivaux,
    (r: Cellule) => r.masse > a.masse * MARGE,
  );
  const proie = plusProche<Cellule>(a.x, a.y, m.rivaux, (r: Cellule) => a.masse > r.masse * MARGE);

  if (menace && menace.d < PORTEE_FUITE) {
    cibleX = -menace.dx;
    cibleY = -menace.dy;
  } else if (proie && proie.d < PORTEE_CHASSE) {
    cibleX = proie.dx;
    cibleY = proie.dy;
  } else {
    const granule = plusProche(a.x, a.y, m.granules);
    if (!granule) return 0;
    cibleX = granule.dx;
    cibleY = granule.dy;
  }

  // La direction discrète la plus alignée avec la cible.
  let meilleure = 0;
  let max = -Infinity;
  for (let k = 0; k < ACTIONS; k++) {
    const s = DIRECTIONS[k][0] * cibleX + DIRECTIONS[k][1] * cibleY;
    if (s > max) {
      max = s;
      meilleure = k;
    }
  }
  return meilleure;
}

/**
 * Un pas de simulation. Renvoie la récompense immédiate.
 *
 * La récompense est la **variation de masse**, plus une pénalité forfaitaire à
 * la mort. Rien d'autre : pas de prime pour s'approcher d'un granule, pas de
 * punition pour toucher un mur. Chaque terme ajouté à une récompense est une
 * occasion d'apprendre à optimiser le terme plutôt que le jeu, et c'est le mode
 * d'échec le plus courant de cette famille d'algorithmes.
 */
export function avancer(m: Monde, action: number, dt = DT): number {
  if (m.mort) return 0;

  const masseAvant = m.agent.masse;
  const [dx, dy] = DIRECTIONS[action];
  deplacer(m, m.agent, dx, dy, dt);

  /*
   * Les rivaux suivent la même heuristique que dans le jeu.
   *
   * Toutes les distances qui suivent sont comparées **au carré**, et les rayons
   * sont sortis des boucles. Ce n'est pas de l'optimisation gratuite : mesuré,
   * l'environnement pesait 22,7 ms par millier de pas contre 2,6 ms pour le
   * réseau, soit 85 % du coût. L'essentiel passait dans treize cents appels à
   * `Math.hypot` par pas, et dans une racine carrée par granule et par mangeur.
   * Un entraînement trop lent pour qu'on voie la politique changer pendant
   * qu'on la regarde n'est pas une démonstration.
   *
   * Le résultat reste exact : comparer d² à r² revient à comparer d à r pour
   * des grandeurs positives.
   */
  const ax = m.agent.x;
  const ay = m.agent.y;
  const fuite2 = PORTEE_FUITE * PORTEE_FUITE;
  const chasse2 = PORTEE_CHASSE * PORTEE_CHASSE;

  for (const r of m.rivaux) {
    const dx = ax - r.x;
    const dy = ay - r.y;
    const dj2 = dx * dx + dy * dy;
    if (dj2 < fuite2 && m.agent.masse > r.masse * MARGE) {
      vers(m, r, r.x * 2 - ax, r.y * 2 - ay, dt);
    } else if (dj2 < chasse2 && r.masse > m.agent.masse * MARGE) {
      vers(m, r, ax, ay, dt);
    } else {
      const g = plusProche(r.x, r.y, m.granules);
      if (g) deplacer(m, r, g.dx, g.dy, dt);
    }
  }

  // Granules absorbés. Le rayon de chaque mangeur est calculé une fois, pas une
  // fois par granule : c'étaient cent trente racines carrées par mangeur.
  const mangeurs = [m.agent, ...m.rivaux];
  const rayons = mangeurs.map((c) => rayon(c.masse) ** 2);
  for (let i = 0; i < m.granules.length; i++) {
    const g = m.granules[i];
    for (let j = 0; j < mangeurs.length; j++) {
      const c = mangeurs[j];
      const dx = g.x - c.x;
      const dy = g.y - c.y;
      if (dx * dx + dy * dy < rayons[j]) {
        c.masse += GAIN_GRANULE;
        rayons[j] = rayon(c.masse) ** 2;
        m.granules[i] = { x: m.alea() * m.largeur, y: m.alea() * m.hauteur };
        break;
      }
    }
  }

  // Collisions entre l'agent et les rivaux.
  let recompense = 0;
  for (let i = 0; i < m.rivaux.length; i++) {
    const r = m.rivaux[i];
    const dx = r.x - m.agent.x;
    const dy = r.y - m.agent.y;
    const seuil = Math.max(rayon(r.masse), rayon(m.agent.masse));
    if (dx * dx + dy * dy > seuil * seuil) continue;

    if (m.agent.masse > r.masse * MARGE) {
      m.agent.masse += r.masse * GAIN_CELLULE;
      m.rivaux[i] = {
        x: m.alea() * m.largeur,
        y: m.alea() * m.hauteur,
        masse: 12 + m.alea() * 30,
      };
    } else if (r.masse > m.agent.masse * MARGE) {
      m.mort = true;
    }
  }

  recompense += m.agent.masse - masseAvant;
  if (m.mort) recompense -= 20;

  m.pas++;
  return recompense;
}

/* -------------------------------------------------------------------------- */
/* La politique                                                                */
/* -------------------------------------------------------------------------- */

export type Politique = {
  w1: Float64Array; // ENTREES × CACHE
  b1: Float64Array; // CACHE
  w2: Float64Array; // CACHE × CACHE
  b2: Float64Array; // CACHE
  w3: Float64Array; // CACHE × ACTIONS
  b3: Float64Array; // ACTIONS
};

/** Initialisation de Xavier, comme dans `mlp.ts` et pour la même raison. */
export function initialiserPolitique(alea: () => number): Politique {
  const remplir = (n: number, entrees: number) => {
    const a = new Float64Array(n);
    const echelle = Math.sqrt(1 / entrees);
    for (let i = 0; i < n; i++) a[i] = (alea() * 2 - 1) * echelle;
    return a;
  };
  return {
    w1: remplir(ENTREES * CACHE, ENTREES),
    b1: new Float64Array(CACHE),
    w2: remplir(CACHE * CACHE, CACHE),
    b2: new Float64Array(CACHE),
    /*
     * La dernière couche part de zéro, contrairement aux autres.
     *
     * Des logits nuls donnent une distribution exactement uniforme au premier
     * épisode : l'agent commence par explorer sans biais. Initialisée au
     * hasard, elle démarre avec une préférence arbitraire pour une direction,
     * que le gradient doit d'abord défaire.
     */
    w3: new Float64Array(CACHE * ACTIONS),
    b3: new Float64Array(ACTIONS),
  };
}

export type Activations = { a1: Float64Array; a2: Float64Array; p: Float64Array };

/** Passe avant. Renvoie la distribution sur les huit directions. */
export function avantPolitique(pol: Politique, x: Float64Array): Activations {
  const a1 = new Float64Array(CACHE);
  for (let j = 0; j < CACHE; j++) {
    let s = pol.b1[j];
    for (let i = 0; i < ENTREES; i++) s += x[i] * pol.w1[i * CACHE + j];
    a1[j] = Math.tanh(s);
  }

  const a2 = new Float64Array(CACHE);
  for (let k = 0; k < CACHE; k++) {
    let s = pol.b2[k];
    for (let j = 0; j < CACHE; j++) s += a1[j] * pol.w2[j * CACHE + k];
    a2[k] = Math.tanh(s);
  }

  const z = new Float64Array(ACTIONS);
  let max = -Infinity;
  for (let a = 0; a < ACTIONS; a++) {
    let s = pol.b3[a];
    for (let k = 0; k < CACHE; k++) s += a2[k] * pol.w3[k * ACTIONS + a];
    z[a] = s;
    if (s > max) max = s;
  }

  // Softmax décalé par le maximum : `exp` d'un grand logit déborde.
  let somme = 0;
  const p = new Float64Array(ACTIONS);
  for (let a = 0; a < ACTIONS; a++) {
    p[a] = Math.exp(z[a] - max);
    somme += p[a];
  }
  for (let a = 0; a < ACTIONS; a++) p[a] /= somme;

  return { a1, a2, p };
}

/** Tire une action dans la distribution. */
export function echantillonner(p: Float64Array, alea: () => number): number {
  let seuil = alea();
  for (let a = 0; a < ACTIONS; a++) {
    seuil -= p[a];
    if (seuil <= 0) return a;
  }
  return ACTIONS - 1;
}

/** L'action la plus probable, sans tirage. Utilisée pour montrer la politique jouer. */
export function meilleureAction(p: Float64Array): number {
  let meilleure = 0;
  for (let a = 1; a < ACTIONS; a++) if (p[a] > p[meilleure]) meilleure = a;
  return meilleure;
}

/* -------------------------------------------------------------------------- */
/* L'entraînement                                                              */
/* -------------------------------------------------------------------------- */

export type Transition = { etat: Float64Array; action: number; recompense: number };

export type Episode = {
  transitions: Transition[];
  /** Masse au terme de l'épisode. */
  masse: number;
  /** Pas de simulation tenus. */
  pas: number;
  /** Vrai si l'agent a été absorbé. */
  mort: boolean;
};

/** Joue un épisode complet avec une politique donnée, en tirant les actions. */
export function jouerEpisode(
  pol: Politique,
  alea: () => number,
  garderTransitions = true,
): Episode {
  const monde = creerMonde(alea);
  const transitions: Transition[] = [];

  while (!monde.mort && monde.pas < PAS_MAX) {
    const etat = observer(monde);
    const { p } = avantPolitique(pol, etat);
    const action = echantillonner(p, alea);
    const recompense = avancer(monde, action);
    if (garderTransitions) transitions.push({ etat, action, recompense });
  }

  return { transitions, masse: monde.agent.masse, pas: monde.pas, mort: monde.mort };
}

/**
 * Ce qui est affiché n'est pas ce qui est optimisé, et c'est délibéré.
 *
 * La politique est entraînée sur une récompense — variation de masse, moins
 * vingt à la mort — parce qu'un gradient a besoin d'un signal à chaque pas. La
 * page, elle, affiche **le temps de survie**, qui est la grandeur qu'un lecteur
 * comprend sans explication et qu'on voit à l'écran.
 *
 * Confondre les deux est le mode d'échec le plus courant de cette famille
 * d'algorithmes : on choisit une récompense parce qu'elle est commode, puis on
 * la présente comme si c'était l'objectif. Ici les deux sont nommés
 * séparément, et si la politique apprenait à grossir en mourant vite, le
 * tableau le montrerait.
 *
 * Le premier score essayé était « la masse finale, zéro si absorbé ». Il a été
 * abandonné après mesure : à cette difficulté, presque tout le monde meurt, et
 * les trois politiques affichaient zéro. Un étalon qui ne sépare rien ne vaut
 * pas mieux que pas d'étalon.
 */
export function secondes(e: { pas: number }): number {
  return e.pas * DT;
}

/**
 * Une étape de gradient sur un lot d'épisodes. Renvoie le score moyen du lot.
 *
 * Les gradients sont accumulés sur tout le lot puis appliqués une seule fois,
 * comme dans `mlp.ts`. La différence est l'origine du signal : là-bas une
 * cible connue, ici un retour observé.
 */
export function apprendrePolitique(
  pol: Politique,
  lot: readonly Episode[],
  reglages: { entropie?: number; pas?: number } = {},
): number {
  const beta = reglages.entropie ?? ENTROPIE;
  const tauxPas = reglages.pas ?? PAS_APPRENTISSAGE;

  const gw1 = new Float64Array(ENTREES * CACHE);
  const gb1 = new Float64Array(CACHE);
  const gw2 = new Float64Array(CACHE * CACHE);
  const gb2 = new Float64Array(CACHE);
  const gw3 = new Float64Array(CACHE * ACTIONS);
  const gb3 = new Float64Array(ACTIONS);

  /*
   * Retours actualisés, calculés à rebours dans chaque épisode.
   *
   *     G_t = r_t + γ·G_{t+1}
   *
   * Puis centrés et réduits **sur tout le lot**. C'est la ligne de base, et
   * c'est elle qui rend l'algorithme utilisable : sans elle, dans un jeu où la
   * masse ne fait que croître, tous les retours sont positifs et toutes les
   * actions sont renforcées.
   */
  const avantages: number[] = [];
  for (const ep of lot) {
    let g = 0;
    const retours = new Array<number>(ep.transitions.length);
    for (let t = ep.transitions.length - 1; t >= 0; t--) {
      g = ep.transitions[t].recompense + GAMMA * g;
      retours[t] = g;
    }
    avantages.push(...retours);
  }

  const n = avantages.length;
  if (n === 0) return 0;

  let moyenne = 0;
  for (const a of avantages) moyenne += a;
  moyenne /= n;
  let variance = 0;
  for (const a of avantages) variance += (a - moyenne) ** 2;
  const ecart = Math.sqrt(variance / n) + 1e-8;
  for (let i = 0; i < n; i++) avantages[i] = (avantages[i] - moyenne) / ecart;

  let curseur = 0;
  for (const ep of lot) {
    for (const tr of ep.transitions) {
      const A = avantages[curseur++];
      const { a1, a2, p } = avantPolitique(pol, tr.etat);

      // Entropie de la distribution, nécessaire au gradient de la prime.
      let entropie = 0;
      for (let a = 0; a < ACTIONS; a++) {
        if (p[a] > 1e-12) entropie -= p[a] * Math.log(p[a]);
      }

      /*
       * Gradient sur les logits.
       *
       * Le terme de politique, `(p − onehot)·A`, est l'annulation classique du
       * couple softmax + log-vraisemblance : la dérivée de la sortie s'écrit
       * directement, sans passer par celle de l'activation.
       *
       * Le second terme est la prime d'entropie. On veut **maximiser**
       * l'entropie, donc minimiser `−β·H`, dont la dérivée vaut
       * `β·p·(log p + H)`.
       */
      const dz3 = new Float64Array(ACTIONS);
      for (let a = 0; a < ACTIONS; a++) {
        const politique = (p[a] - (a === tr.action ? 1 : 0)) * A;
        const prime = beta * p[a] * (Math.log(Math.max(p[a], 1e-12)) + entropie);
        dz3[a] = politique + prime;
        gb3[a] += dz3[a];
        for (let k = 0; k < CACHE; k++) gw3[k * ACTIONS + a] += a2[k] * dz3[a];
      }

      const dz2 = new Float64Array(CACHE);
      for (let k = 0; k < CACHE; k++) {
        let s = 0;
        for (let a = 0; a < ACTIONS; a++) s += dz3[a] * pol.w3[k * ACTIONS + a];
        dz2[k] = s * (1 - a2[k] * a2[k]);
        gb2[k] += dz2[k];
        for (let j = 0; j < CACHE; j++) gw2[j * CACHE + k] += a1[j] * dz2[k];
      }

      for (let j = 0; j < CACHE; j++) {
        let s = 0;
        for (let k = 0; k < CACHE; k++) s += dz2[k] * pol.w2[j * CACHE + k];
        const dz1 = s * (1 - a1[j] * a1[j]);
        gb1[j] += dz1;
        for (let i = 0; i < ENTREES; i++) gw1[i * CACHE + j] += tr.etat[i] * dz1;
      }
    }
  }

  /*
   * Le pas est divisé par le nombre d'**épisodes**, pas de transitions.
   *
   * L'estimateur de REINFORCE est une somme le long de la trajectoire, dont on
   * prend la moyenne sur les épisodes du lot. Diviser par le nombre de
   * transitions donne un gradient soixante fois trop petit, et un réseau qui
   * bouge si lentement qu'il a l'air cassé : mesuré, la norme de la dernière
   * couche atteignait 0,015 après soixante mises à jour, et la distribution
   * restait uniforme à trois décimales. Ce n'était pas un bogue de signe, ce
   * qu'on soupçonne d'abord, mais une division de trop.
   */
  const pas = tauxPas / lot.length;
  for (let i = 0; i < gw1.length; i++) pol.w1[i] -= pas * gw1[i];
  for (let i = 0; i < gb1.length; i++) pol.b1[i] -= pas * gb1[i];
  for (let i = 0; i < gw2.length; i++) pol.w2[i] -= pas * gw2[i];
  for (let i = 0; i < gb2.length; i++) pol.b2[i] -= pas * gb2[i];
  for (let i = 0; i < gw3.length; i++) pol.w3[i] -= pas * gw3[i];
  for (let i = 0; i < gb3.length; i++) pol.b3[i] -= pas * gb3[i];

  let total = 0;
  for (const ep of lot) total += secondes(ep);
  return total / lot.length;
}

/* -------------------------------------------------------------------------- */
/* Les étalons                                                                 */
/* -------------------------------------------------------------------------- */

export type Etalon = "aleatoire" | "heuristique" | "apprise";

export type Mesure = {
  /** Temps de survie moyen, en secondes. C'est le nombre affiché en barres. */
  secondes: number;
  /** Masse moyenne au terme de l'épisode, mort ou vif. */
  masse: number;
  /** Part d'épisodes menés à terme sans être absorbé, en pourcentage. */
  survie: number;
  episodes: number;
};

/**
 * Fait jouer un décideur sur `episodes` parties et renvoie son score moyen.
 *
 * La graine est passée explicitement : les trois politiques comparées partent
 * des **mêmes mondes initiaux**, pas de mondes tirés séparément. Les flux
 * divergent ensuite, puisqu'un agent qui mange plus fait réapparaître plus de
 * granules, mais la position de départ de chaque rival et de chaque granule est
 * la même pour les trois. Sur un jeu aussi bruité, comparer des moyennes sur
 * des mondes différents demanderait bien plus d'épisodes pour la même
 * confiance.
 */
export function evaluer(
  decider: (m: Monde) => number,
  episodes: number,
  graine: number,
): Mesure {
  let totalPas = 0;
  let totalMasse = 0;
  let vivants = 0;

  for (let e = 0; e < episodes; e++) {
    const alea = creerAlea(graine + e * 7919);
    const monde = creerMonde(alea);
    while (!monde.mort && monde.pas < PAS_MAX) {
      avancer(monde, decider(monde));
    }
    totalPas += monde.pas;
    totalMasse += monde.agent.masse;
    if (!monde.mort) vivants++;
  }

  return {
    secondes: (totalPas / episodes) * DT,
    masse: totalMasse / episodes,
    survie: (vivants / episodes) * 100,
    episodes,
  };
}

/** Décideur aléatoire uniforme : le plancher que toute politique doit franchir. */
export function decideurAleatoire(alea: () => number) {
  return () => Math.floor(alea() * ACTIONS);
}

/** Décideur suivant une politique apprise, en prenant l'action la plus probable. */
export function decideurPolitique(pol: Politique) {
  const tampon = new Float64Array(ENTREES);
  return (m: Monde) => meilleureAction(avantPolitique(pol, observer(m, tampon)).p);
}

/**
 * Les étalons, mesurés hors ligne.
 *
 * Recalculer 200 épisodes de chaque étalon à l'ouverture de la page coûterait
 * plusieurs secondes de calcul pour un résultat invariable. Ils sont donc figés
 * ici — et un test unitaire les recalcule et refuse de passer s'ils dérivent,
 * parce qu'une constante recopiée à la main est une constante qui finit par
 * mentir.
 *
 * Protocole : 200 mondes tirés de la graine `GRAINE_ETALONS`, 400 pas au plus,
 * les deux étalons jouant les mêmes mondes de départ.
 */
export const GRAINE_ETALONS = 20260819;
export const EPISODES_ETALONS = 200;

export const ETALONS = {
  /** Direction tirée uniformément à chaque pas. */
  hasard: { secondes: 1.87, masse: 46.7, survie: 0 },
  /** La règle qui pilote les rivaux du jeu, contrainte aux mêmes huit directions. */
  heuristique: { secondes: 7.63, masse: 72.2, survie: 18.5 },
} as const;

/* -------------------------------------------------------------------------- */
/* L'entraîneur                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Pas de simulation joués par image.
 *
 * Mesuré à 10,2 ms pour mille pas, soit environ 4,3 ms par image — de quoi
 * tenir soixante images par seconde en laissant de la marge au rendu. À ce
 * rythme la politique voit quelques centaines d'épisodes par seconde, et le
 * visiteur la voit passer de « meurt en deux secondes » à « tient dix
 * secondes » en une vingtaine de secondes de présence.
 *
 * C'est un nombre de pas et non un budget en millisecondes, et la distinction
 * compte : un budget rendrait le travail par image dépendant de la vitesse de
 * la machine, donc la démonstration non reproductible, donc les tests de
 * régression visuelle instables.
 */
export const PAS_PAR_IMAGE = 420;

/** Lots d'entraînement entre deux évaluations. */
const LOTS_ENTRE_EVALUATIONS = 5;
/** Mondes joués à chaque évaluation. */
export const EPISODES_EVALUATION = 12;

export type Entraineur = {
  politique: Politique;
  /** Épisodes d'entraînement terminés depuis le début. */
  episodes: number;
  /** Dernière évaluation, comparable aux étalons. `null` avant la première. */
  mesure: Mesure | null;
  /** Meilleure évaluation atteinte, en secondes. */
  meilleure: number;
  /** Une évaluation par relevé, pour tracer la courbe. */
  historique: number[];
  /** Vrai pendant qu'une évaluation est en cours. */
  enEvaluation: boolean;
  /** Fait franchir `pas` pas de simulation au travail en cours. */
  travailler: (pas: number) => void;
};

/**
 * Entraînement étalé sur les images, plutôt qu'en bloc.
 *
 * ## Pourquoi ce n'est pas une simple boucle
 *
 * Un épisode coûte de une à quatre millisecondes selon la durée de survie de
 * l'agent, et il coûte d'autant plus cher qu'il joue bien : c'est la pire
 * propriété possible pour une boucle de rendu, puisque l'affichage sauterait
 * exactement au moment où la démonstration devient intéressante. L'entraîneur
 * conserve donc un épisode **en cours** entre deux images et ne lui fait
 * franchir qu'un nombre fixe de pas.
 *
 * ## Pourquoi il évalue séparément
 *
 * Pendant l'entraînement, les actions sont **tirées** dans la distribution :
 * c'est l'exploration, et sans elle rien ne s'apprend. Les étalons, eux, jouent
 * l'action la plus probable. Afficher la moyenne d'entraînement à côté d'eux
 * comparerait une politique en train d'explorer à deux politiques qui font de
 * leur mieux, et sous-estimerait la première de plusieurs secondes.
 *
 * Tous les cinq lots, l'entraîneur joue donc douze mondes en prenant l'action
 * la plus probable et sans rien apprendre. Ces douze mondes sont les douze
 * premiers de la série qui a servi aux étalons : à l'écran, les trois barres
 * décrivent le même problème.
 */
export function creerEntraineur(graine: number): Entraineur {
  const alea = creerAlea(graine);
  const politique = initialiserPolitique(alea);

  let monde = creerMonde(alea);
  let transitions: Transition[] = [];
  const lot: Episode[] = [];
  let lotsDepuisEvaluation = 0;

  // État de l'évaluation en cours.
  let evalIndex = 0;
  let evalPas = 0;
  let evalMasse = 0;
  let evalVivants = 0;
  const tampon = new Float64Array(ENTREES);

  function demarrerEvaluation() {
    evalIndex = 0;
    evalPas = 0;
    evalMasse = 0;
    evalVivants = 0;
    monde = creerMonde(creerAlea(GRAINE_ETALONS));
    e.enEvaluation = true;
  }

  function finirEpisodeEvalue() {
    evalPas += monde.pas;
    evalMasse += monde.agent.masse;
    if (!monde.mort) evalVivants++;
    evalIndex++;

    if (evalIndex >= EPISODES_EVALUATION) {
      e.mesure = {
        secondes: (evalPas / EPISODES_EVALUATION) * DT,
        masse: evalMasse / EPISODES_EVALUATION,
        survie: (evalVivants / EPISODES_EVALUATION) * 100,
        episodes: EPISODES_EVALUATION,
      };
      e.meilleure = Math.max(e.meilleure, e.mesure.secondes);
      e.historique.push(e.mesure.secondes);
      if (e.historique.length > 240) e.historique.shift();
      e.enEvaluation = false;
      monde = creerMonde(alea);
      transitions = [];
      return;
    }
    // Les mêmes graines que `evaluer`, pour que les mondes soient les mêmes.
    monde = creerMonde(creerAlea(GRAINE_ETALONS + evalIndex * 7919));
  }

  const e: Entraineur = {
    politique,
    episodes: 0,
    mesure: null,
    meilleure: 0,
    historique: [],
    enEvaluation: false,
    travailler(pas: number) {
      for (let n = 0; n < pas; n++) {
        const fini = monde.mort || monde.pas >= PAS_MAX;

        if (e.enEvaluation) {
          if (fini) {
            finirEpisodeEvalue();
            continue;
          }
          avancer(monde, meilleureAction(avantPolitique(politique, observer(monde, tampon)).p));
          continue;
        }

        if (fini) {
          lot.push({ transitions, masse: monde.agent.masse, pas: monde.pas, mort: monde.mort });
          e.episodes++;
          transitions = [];
          monde = creerMonde(alea);

          if (lot.length >= LOT_EPISODES) {
            apprendrePolitique(politique, lot);
            lot.length = 0;
            lotsDepuisEvaluation++;
            if (lotsDepuisEvaluation >= LOTS_ENTRE_EVALUATIONS) {
              lotsDepuisEvaluation = 0;
              demarrerEvaluation();
            }
          }
          continue;
        }

        const etat = observer(monde);
        const { p } = avantPolitique(politique, etat);
        const action = echantillonner(p, alea);
        const recompense = avancer(monde, action);
        transitions.push({ etat, action, recompense });
      }
    },
  };

  return e;
}
