/**
 * Les mesures du banc d'évaluation.
 *
 * Fonctions pures, sans modèle ni réseau : elles reçoivent ce que le moteur a
 * rendu et ce qu'on attendait, et rien d'autre. C'est ce qui permet de les
 * tester sur des cas construits à la main, où la bonne valeur se calcule de
 * tête.
 *
 * ## Quatre nombres, et ce que chacun cache
 *
 * Aucun ne suffit seul, et c'est pour cela qu'ils sont quatre.
 *
 *  - **Rappel@k** : la part des questions où au moins un bon passage remonte.
 *    Il ignore le rang : trouver la bonne réponse en quatrième position compte
 *    autant que la trouver en première, alors que personne ne lit la
 *    quatrième.
 *
 *  - **Rang réciproque moyen** : la moyenne de 1/rang du premier bon passage.
 *    Il corrige le précédent, mais ne dit rien de ce qui accompagne la bonne
 *    réponse — un moteur qui la place première et remplit le reste de bruit
 *    obtient 1,00.
 *
 *  - **Précision@k** : la part de bons passages parmi tout ce qui est rendu.
 *    Elle attrape ce bruit, et elle est plafonnée par construction : quand une
 *    question n'a que deux bonnes réponses et que le moteur en rend quatre, la
 *    précision ne peut pas dépasser 0,50 même en étant parfaite. La lire comme
 *    une note sur vingt serait une erreur.
 *
 *  - **Silence** : la part des questions hors corpus où le moteur ne cite
 *    rien. C'est le seul des quatre qui punisse un système trop bavard, et
 *    c'est celui qu'on omet le plus souvent, parce qu'il fait baisser la moyenne.
 */

export type CasRendu = {
  id: string;
  /** Identifiants renvoyés par le moteur, dans l'ordre du classement. */
  rendus: readonly string[];
  /** Identifiants attendus. Vide pour une question hors corpus. */
  attendus: readonly string[];
};

export type Bilan = {
  /** Nombre maximal de passages que le moteur pouvait rendre. */
  k: number;
  /** Questions dont au moins un passage était attendu. */
  avecReponse: number;
  /** Questions dont la bonne réponse était le silence. */
  sansReponse: number;
  rappel: number;
  mrr: number;
  precision: number;
  silence: number;
};

/**
 * Rang du premier passage attendu, à partir de 1. Zéro s'il n'y en a aucun.
 */
export function rangPremierAttendu(cas: CasRendu): number {
  for (let i = 0; i < cas.rendus.length; i++) {
    if (cas.attendus.includes(cas.rendus[i])) return i + 1;
  }
  return 0;
}

function moyenne(valeurs: readonly number[]): number {
  if (valeurs.length === 0) return 0;
  return valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
}

export function noter(cas: readonly CasRendu[], k: number): Bilan {
  const avec = cas.filter((c) => c.attendus.length > 0);
  const sans = cas.filter((c) => c.attendus.length === 0);

  const rangs = avec.map(rangPremierAttendu);

  /*
   * La précision est calculée sur le total, pas comme une moyenne de moyennes.
   *
   * Moyenner les précisions par question donnerait le même poids à une
   * question qui rend un passage et à une qui en rend quatre. Sur un jeu de
   * cette taille, l'écart entre les deux formules est visible, et l'agrégat
   * total est celui qui décrit ce qu'un lecteur voit réellement passer.
   */
  const rendusTotal = avec.reduce((s, c) => s + c.rendus.length, 0);
  const bonsTotal = avec.reduce(
    (s, c) => s + c.rendus.filter((id) => c.attendus.includes(id)).length,
    0,
  );

  return {
    k,
    avecReponse: avec.length,
    sansReponse: sans.length,
    rappel: moyenne(rangs.map((r) => (r > 0 ? 1 : 0))),
    mrr: moyenne(rangs.map((r) => (r > 0 ? 1 / r : 0))),
    precision: rendusTotal === 0 ? 0 : bonsTotal / rendusTotal,
    silence: moyenne(sans.map((c) => (c.rendus.length === 0 ? 1 : 0))),
  };
}

/* -------------------------------------------------------------------------- */
/* L'artefact publié                                                           */
/* -------------------------------------------------------------------------- */

/** Ce qu'un cas a réellement produit, tel qu'il est publié et affiché. */
export type CasPublie = {
  id: string;
  rendus: { id: string; source: string; score: number; attendu: boolean }[];
  attendus: string[];
  /** Attendus qu'aucun passage rendu ne couvre. */
  manques: string[];
  rang: number;
};

export type Evaluation = {
  langue: string;
  modele: string;
  /** Nombre de passages du corpus au moment de la mesure. */
  passages: number;
  seuil: number;
  bilan: Bilan;
  /** La courbe du compromis, qui justifie le seuil retenu. */
  courbe: PointSeuil[];
  cas: CasPublie[];
};

/** Un cas est réussi s'il trouve un attendu, ou s'il se tait quand il le doit. */
export function reussi(cas: Pick<CasPublie, "attendus" | "rendus" | "rang">): boolean {
  return cas.attendus.length === 0 ? cas.rendus.length === 0 : cas.rang > 0;
}

/* -------------------------------------------------------------------------- */
/* Le balayage du seuil                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Un point de la courbe : ce que coûte et ce que rapporte un seuil donné.
 *
 * Le seuil de pertinence arbitre entre deux erreurs opposées. Trop bas, le
 * moteur répond à une question hors sujet parce qu'un passage flotte
 * au-dessus. Trop haut, il se tait sur une question à laquelle le corpus
 * répond. Aucune des deux n'est gratuite, et la seule façon honnête de choisir
 * est de regarder les deux courbes ensemble.
 */
export type PointSeuil = {
  seuil: number;
  rappel: number;
  silence: number;
  precision: number;
};

/** Seuils balayés, du plus permissif au plus sévère. */
export const SEUILS_BALAYES = [0.14, 0.18, 0.22, 0.26, 0.3, 0.34, 0.38, 0.42];
