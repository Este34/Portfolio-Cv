import { describe, expect, it } from "vitest";

import { creerAlea } from "../src/lib/mlp.ts";
import {
  ACTIONS,
  ENTREES,
  EPISODES_ETALONS,
  ETALONS,
  GRAINE_ETALONS,
  LOT_EPISODES,
  PAS_MAX,
  apprendrePolitique,
  avancer,
  avantPolitique,
  creerMonde,
  decideurAleatoire,
  decideurPolitique,
  evaluer,
  heuristique,
  initialiserPolitique,
  jouerEpisode,
  observer,
  type Episode,
} from "../src/lib/renforcement.ts";

/**
 * Apprentissage par renforcement : ce que ces tests attrapent.
 *
 * Une politique cassée ne plante pas. Elle produit un agent qui bouge, qui a
 * l'air de chercher quelque chose, et qui n'apprend rien — ou pire, qui
 * désapprend lentement. À l'écran, les trois cas se ressemblent : ça bouge.
 *
 * D'où deux familles de tests. Les uns vérifient la mécanique là où une erreur
 * de signe se voit immédiatement, sur un cas construit à la main. Les autres
 * font tourner l'algorithme pour de vrai et exigent qu'il batte le hasard,
 * parce que c'est la seule affirmation qui compte et la seule qu'on ne puisse
 * pas obtenir par accident.
 */

describe("le monde", () => {
  it("est reproductible à graine égale", () => {
    const jouer = () => {
      const alea = creerAlea(4242);
      const m = creerMonde(alea);
      while (!m.mort && m.pas < PAS_MAX) avancer(m, heuristique(m));
      return { pas: m.pas, masse: m.agent.masse, mort: m.mort };
    };
    expect(jouer()).toEqual(jouer());
  });

  it("ne perçoit jamais de valeur aberrante", () => {
    const alea = creerAlea(11);
    const m = creerMonde(alea);
    for (let t = 0; t < 200 && !m.mort; t++) {
      const etat = observer(m);
      expect(etat).toHaveLength(ENTREES);
      for (const v of etat) {
        expect(Number.isFinite(v)).toBe(true);
        // Les proximités et les cosinus vivent dans [−1, 1] ; la marge couvre
        // la masse passée à la tangente hyperbolique.
        expect(Math.abs(v)).toBeLessThanOrEqual(1.001);
      }
      avancer(m, heuristique(m));
    }
  });

  it("ne propose à l'heuristique que des actions valides", () => {
    const alea = creerAlea(5);
    const m = creerMonde(alea);
    for (let t = 0; t < 300 && !m.mort; t++) {
      const a = heuristique(m);
      expect(Number.isInteger(a)).toBe(true);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(ACTIONS);
      avancer(m, a);
    }
  });
});

describe("la politique", () => {
  it("sort une distribution de probabilité", () => {
    const pol = initialiserPolitique(creerAlea(3));
    const m = creerMonde(creerAlea(3));
    const { p } = avantPolitique(pol, observer(m));

    let somme = 0;
    for (const v of p) {
      expect(v).toBeGreaterThan(0);
      somme += v;
    }
    expect(somme).toBeCloseTo(1, 12);
  });

  it("part exactement uniforme", () => {
    /*
     * La dernière couche est initialisée à zéro, donc tous les logits valent le
     * biais, donc zéro. Ce test garde cette propriété : elle est ce qui garantit
     * que le premier épisode explore sans préférence héritée du tirage de
     * Xavier.
     */
    const pol = initialiserPolitique(creerAlea(77));
    const m = creerMonde(creerAlea(77));
    const { p } = avantPolitique(pol, observer(m));
    for (const v of p) expect(v).toBeCloseTo(1 / ACTIONS, 12);
  });
});

describe("le gradient", () => {
  /**
   * Le test qu'un signe inversé ne survit pas.
   *
   * Deux transitions depuis **le même état**, la première récompensée et la
   * seconde non. Après actualisation puis centrage sur le lot, la première
   * reçoit un avantage positif et la seconde un avantage négatif. Une mise à
   * jour correcte augmente donc la probabilité de l'action récompensée et
   * diminue celle de l'autre, au même état.
   *
   * La prime d'entropie est coupée ici : elle pousse dans la direction inverse,
   * vers l'uniforme, et brouillerait exactement ce qu'on cherche à mesurer.
   */
  it("pousse l'action récompensée et retient l'autre", () => {
    const pol = initialiserPolitique(creerAlea(9));
    const etat = observer(creerMonde(creerAlea(9)));

    const avant = avantPolitique(pol, etat).p;
    const recompensee = 0;
    const punie = 1;

    const episode: Episode = {
      transitions: [
        { etat, action: recompensee, recompense: 10 },
        { etat, action: punie, recompense: 0 },
      ],
      masse: 45,
      pas: 2,
      mort: false,
    };

    apprendrePolitique(pol, [episode], { entropie: 0, pas: 1 });
    const apres = avantPolitique(pol, etat).p;

    expect(apres[recompensee]).toBeGreaterThan(avant[recompensee]);
    expect(apres[punie]).toBeLessThan(avant[punie]);
  });
});

describe("les étalons", () => {
  /*
   * Les valeurs affichées sur la page sont figées dans le code, pour éviter de
   * recalculer 400 épisodes à chaque ouverture. Ce test les recalcule et refuse
   * de passer si elles ont dérivé : une constante recopiée à la main est une
   * constante qui finit par mentir, et celle-ci sert de référence à tout le
   * reste de la démonstration.
   */
  it("valent ce que le code affiche", () => {
    const hasard = evaluer(decideurAleatoire(creerAlea(7)), EPISODES_ETALONS, GRAINE_ETALONS);
    const regle = evaluer(heuristique, EPISODES_ETALONS, GRAINE_ETALONS);

    expect(hasard.secondes).toBeCloseTo(ETALONS.hasard.secondes, 1);
    expect(hasard.masse).toBeCloseTo(ETALONS.hasard.masse, 1);
    expect(hasard.survie).toBeCloseTo(ETALONS.hasard.survie, 1);

    expect(regle.secondes).toBeCloseTo(ETALONS.heuristique.secondes, 1);
    expect(regle.masse).toBeCloseTo(ETALONS.heuristique.masse, 1);
    expect(regle.survie).toBeCloseTo(ETALONS.heuristique.survie, 1);
  });

  it("classent l'heuristique nettement au-dessus du hasard", () => {
    // Sans cet écart, la démonstration n'aurait rien à montrer : un
    // environnement où bien jouer ne sert à rien ne s'apprend pas.
    expect(ETALONS.heuristique.secondes).toBeGreaterThan(ETALONS.hasard.secondes * 3);
  });
});

describe("l'apprentissage", () => {
  /**
   * L'affirmation centrale de la démonstration, vérifiée plutôt qu'affichée.
   *
   * 1 600 épisodes suffisent à trancher : mesurée sur huit graines, la politique
   * dépasse alors le hasard d'un facteur deux au minimum. Le seuil est posé bien
   * en dessous de ce qui est constaté, parce qu'un test d'apprentissage doit
   * attraper une régression franche sans se déclencher sur une graine malchanceuse.
   */
  it("bat le hasard après mille six cents épisodes", { timeout: 60_000 }, () => {
    const alea = creerAlea(42);
    const pol = initialiserPolitique(alea);

    for (let vus = 0; vus < 1600; vus += LOT_EPISODES) {
      const lot: Episode[] = [];
      for (let i = 0; i < LOT_EPISODES; i++) lot.push(jouerEpisode(pol, alea));
      apprendrePolitique(pol, lot);
    }

    const apprise = evaluer(decideurPolitique(pol), 120, GRAINE_ETALONS);
    expect(apprise.secondes).toBeGreaterThan(ETALONS.hasard.secondes * 2);
  });
});
