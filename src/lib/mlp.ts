/**
 * Un perceptron multicouche écrit à la main.
 *
 * Passe avant, passe arrière, descente de gradient sur mini-lots — sans
 * TensorFlow ni PyTorch. Même parti pris que mon projet de recherche augmentée :
 * on ne comprend un mécanisme qu'en l'implémentant.
 *
 * **Ce module ne contient aucun rendu et aucune dépendance à React**, pour une
 * raison précise : c'est ce qui permet de vérifier en Node que le réseau
 * apprend réellement. Une erreur de signe dans la passe arrière produit un
 * réseau qui tourne, affiche une jolie animation, et n'apprend rien — le genre
 * de bogue qu'un test unitaire attrape et qu'un œil ne voit pas.
 */

/** Neurones par couche cachée. */
export const H = 12;
/** Taux d'apprentissage. */
export const PAS = 0.6;
/** Taille du mini-lot. */
export const LOT = 24;

export type Reseau = {
  w1: Float64Array; // 2 × H
  b1: Float64Array; // H
  w2: Float64Array; // H × H
  b2: Float64Array; // H
  w3: Float64Array; // H × 1
  b3: Float64Array; // 1
};

export type Exemple = { x: number; y: number; classe: 0 | 1 };

/** Générateur déterministe : deux exécutions donnent la même figure. */
export function creerAlea(graine: number): () => number {
  const etat = { g: graine };
  return () => {
    etat.g = (etat.g * 1664525 + 1013904223) % 4294967296;
    return etat.g / 4294967296;
  };
}

/**
 * Initialisation de Xavier.
 *
 * Des poids tirés uniformément entre −1 et 1 saturent immédiatement les
 * tangentes hyperboliques : les gradients s'annulent et le réseau n'apprend
 * rien. L'échelle en 1/√(entrées) maintient la variance des activations d'une
 * couche à l'autre.
 */
export function initialiser(alea: () => number): Reseau {
  const remplir = (n: number, entrees: number) => {
    const a = new Float64Array(n);
    const echelle = Math.sqrt(1 / entrees);
    for (let i = 0; i < n; i++) a[i] = (alea() * 2 - 1) * echelle;
    return a;
  };
  return {
    w1: remplir(2 * H, 2),
    b1: new Float64Array(H),
    w2: remplir(H * H, H),
    b2: new Float64Array(H),
    w3: remplir(H, H),
    b3: new Float64Array(1),
  };
}

/** Passe avant. Les activations sont renvoyées : la passe arrière les réutilise. */
export function avant(r: Reseau, x: number, y: number) {
  const a1 = new Float64Array(H);
  for (let j = 0; j < H; j++) {
    a1[j] = Math.tanh(x * r.w1[j] + y * r.w1[H + j] + r.b1[j]);
  }

  const a2 = new Float64Array(H);
  for (let k = 0; k < H; k++) {
    let s = r.b2[k];
    for (let j = 0; j < H; j++) s += a1[j] * r.w2[j * H + k];
    a2[k] = Math.tanh(s);
  }

  let z3 = r.b3[0];
  for (let k = 0; k < H; k++) z3 += a2[k] * r.w3[k];
  // Sigmoïde stable : `exp` d'un grand positif déborde.
  const a3 = z3 >= 0 ? 1 / (1 + Math.exp(-z3)) : Math.exp(z3) / (1 + Math.exp(z3));

  return { a1, a2, a3 };
}

/**
 * Une étape de descente de gradient sur un mini-lot. Renvoie la perte moyenne.
 *
 * Les gradients sont accumulés sur tout le lot puis appliqués une seule fois :
 * mettre à jour après chaque exemple rendrait la trajectoire trop bruitée pour
 * qu'on voie quoi que ce soit à l'écran.
 *
 * La combinaison entropie croisée binaire + sigmoïde donne directement
 * `dz3 = a3 − cible`, sans passer par la dérivée de la sigmoïde — c'est
 * l'annulation classique, et c'est aussi ce qui évite l'instabilité numérique.
 */
export function apprendre(r: Reseau, lot: readonly Exemple[]): number {
  const gw1 = new Float64Array(2 * H);
  const gb1 = new Float64Array(H);
  const gw2 = new Float64Array(H * H);
  const gb2 = new Float64Array(H);
  const gw3 = new Float64Array(H);
  let gb3 = 0;
  let perte = 0;

  for (const ex of lot) {
    const { a1, a2, a3 } = avant(r, ex.x, ex.y);
    const cible = ex.classe;

    // Entropie croisée binaire, bornée pour éviter log(0).
    const p = Math.min(Math.max(a3, 1e-7), 1 - 1e-7);
    perte += -(cible * Math.log(p) + (1 - cible) * Math.log(1 - p));

    const dz3 = a3 - cible;
    gb3 += dz3;
    for (let k = 0; k < H; k++) gw3[k] += a2[k] * dz3;

    const dz2 = new Float64Array(H);
    for (let k = 0; k < H; k++) {
      dz2[k] = dz3 * r.w3[k] * (1 - a2[k] * a2[k]);
      gb2[k] += dz2[k];
      for (let j = 0; j < H; j++) gw2[j * H + k] += a1[j] * dz2[k];
    }

    for (let j = 0; j < H; j++) {
      let s = 0;
      for (let k = 0; k < H; k++) s += dz2[k] * r.w2[j * H + k];
      const dz1 = s * (1 - a1[j] * a1[j]);
      gb1[j] += dz1;
      gw1[j] += ex.x * dz1;
      gw1[H + j] += ex.y * dz1;
    }
  }

  const n = lot.length || 1;
  const pas = PAS / n;
  for (let i = 0; i < gw1.length; i++) r.w1[i] -= pas * gw1[i];
  for (let i = 0; i < gb1.length; i++) r.b1[i] -= pas * gb1[i];
  for (let i = 0; i < gw2.length; i++) r.w2[i] -= pas * gw2[i];
  for (let i = 0; i < gb2.length; i++) r.b2[i] -= pas * gb2[i];
  for (let i = 0; i < gw3.length; i++) r.w3[i] -= pas * gw3[i];
  r.b3[0] -= pas * gb3;

  return perte / n;
}

/**
 * Deux spirales entrelacées, dans [−1, 1].
 *
 * Choisies parce qu'aucune droite ne les sépare : un modèle linéaire plafonne
 * autour de 50 % de justesse, ce qui rend visible l'apport des couches cachées.
 */
export function spirales(alea: () => number, parClasse = 90): Exemple[] {
  const points: Exemple[] = [];
  for (const classe of [0, 1] as const) {
    for (let i = 0; i < parClasse; i++) {
      /*
       * Enroulement choisi par balayage, pas au hasard.
       *
       * Deux conditions devaient tenir ensemble : qu'un classifieur linéaire
       * échoue clairement, et que le réseau converge assez vite pour qu'on
       * regarde la frontière se former plutôt qu'une animation qui traîne.
       *
       * Mesures du plafond d'un demi-plan (balayage exhaustif orientations ×
       * seuils × polarités) contre la justesse du réseau après 20 000 lots :
       *
       *   enroulement 3,4 → linéaire 93 %  (la démonstration ne démontrait rien)
       *   enroulement 4   → linéaire 84 %, réseau 100 %
       *   enroulement 5   → linéaire 75 %, réseau 100 %   ← retenu
       *   enroulement 7   → linéaire 65 %, réseau  69 %  (trop dur, ça traîne)
       */
      const enroulement = 5;
      const t = (i / parClasse) * enroulement;
      const angle = t + classe * Math.PI;
      const rayon = 0.1 + (t / enroulement) * 0.88;
      const bruit = 0.02;
      points.push({
        x: Math.cos(angle) * rayon + (alea() * 2 - 1) * bruit,
        y: Math.sin(angle) * rayon + (alea() * 2 - 1) * bruit,
        classe,
      });
    }
  }

  /*
   * Mélange de Fisher-Yates, et il n'est pas cosmétique.
   *
   * Les points sont générés classe par classe. Sans mélange, un parcours
   * séquentiel produit des mini-lots presque mono-classe : le réseau apprend
   * alternativement « tout est 0 » puis « tout est 1 », oscille, et s'effondre
   * à 50 % de justesse. Mesuré : aucune valeur d'enroulement ne permettait la
   * convergence tant que ce mélange manquait — j'ai d'abord accusé les données
   * et l'architecture avant de trouver la cause.
   */
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  return points;
}

/** Part d'exemples correctement classés, en pourcentage. */
export function justesse(r: Reseau, donnees: readonly Exemple[]): number {
  let bons = 0;
  for (const ex of donnees) {
    const { a3 } = avant(r, ex.x, ex.y);
    if ((a3 >= 0.5 ? 1 : 0) === ex.classe) bons++;
  }
  return (bons / donnees.length) * 100;
}
