import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { construireCorpus } from "@/content/corpus";
import { CAS_AVEC_REPONSE, CAS_SANS_REPONSE, EVALUATIONS } from "@/content/evaluations";
import {
  noter,
  rangPremierAttendu,
  reussi,
  SEUILS_BALAYES,
  type Evaluation,
} from "@/lib/evaluation";
import { LANGUES } from "@/lib/langue";
import { SEUIL_PERTINENCE } from "@/lib/rag-types";

/**
 * Le banc d'évaluation : ce que ces tests attrapent.
 *
 * Une mesure fausse est pire qu'une absence de mesure, parce qu'elle porte
 * l'autorité d'un chiffre. Les métriques sont donc vérifiées sur des cas
 * construits à la main, où la bonne valeur se calcule de tête et où une erreur
 * d'indice se voit — un rang compté à partir de zéro doublerait le rang
 * réciproque moyen sans que rien ne casse.
 *
 * Le jeu de questions, lui, est vérifié pour ce qu'il est : un jeu peut être
 * biaisé sans être faux, et une vérité terrain qui pointerait vers des
 * passages inexistants ferait chuter le rappel pour une raison sans rapport
 * avec le moteur.
 */

describe("les métriques", () => {
  const cas = (rendus: string[], attendus: string[]) => ({ id: "x", rendus, attendus });

  it("compte le rang à partir de un", () => {
    expect(rangPremierAttendu(cas(["a", "b", "c"], ["a"]))).toBe(1);
    expect(rangPremierAttendu(cas(["a", "b", "c"], ["c"]))).toBe(3);
    expect(rangPremierAttendu(cas(["a", "b"], ["z"]))).toBe(0);
    expect(rangPremierAttendu(cas([], ["a"]))).toBe(0);
  });

  it("prend le premier attendu, pas le meilleur", () => {
    // Deux attendus présents : le rang est celui du premier rencontré.
    expect(rangPremierAttendu(cas(["x", "b", "a"], ["a", "b"]))).toBe(2);
  });

  it("calcule un rappel et un MRR vérifiables à la main", () => {
    const bilan = noter(
      [
        cas(["a", "x", "y", "z"], ["a"]), // rang 1
        cas(["x", "b", "y", "z"], ["b"]), // rang 2
        cas(["x", "y", "z", "w"], ["c"]), // manqué
        cas(["x", "y"], []), // hors corpus, mais bavard
        cas([], []), // hors corpus, silencieux
      ],
      4,
    );

    expect(bilan.avecReponse).toBe(3);
    expect(bilan.sansReponse).toBe(2);
    // Deux trouvés sur trois.
    expect(bilan.rappel).toBeCloseTo(2 / 3, 10);
    // (1/1 + 1/2 + 0) / 3
    expect(bilan.mrr).toBeCloseTo(0.5, 10);
    // 2 bons passages sur 12 rendus.
    expect(bilan.precision).toBeCloseTo(2 / 12, 10);
    // Un silence sur deux.
    expect(bilan.silence).toBeCloseTo(0.5, 10);
  });

  /**
   * Le piège que la précision doit tendre.
   *
   * Un moteur qui place toujours la bonne réponse en tête obtient un rappel et
   * un MRR parfaits, même en noyant le reste de bruit. Sans précision, ce
   * système passerait pour excellent.
   */
  it("distingue un moteur précis d'un moteur bavard", () => {
    const precis = noter([cas(["a"], ["a"]), cas(["b"], ["b"])], 4);
    const bavard = noter([cas(["a", "x", "y", "z"], ["a"]), cas(["b", "x", "y", "z"], ["b"])], 4);

    expect(precis.rappel).toBe(bavard.rappel);
    expect(precis.mrr).toBe(bavard.mrr);
    expect(precis.precision).toBeGreaterThan(bavard.precision);
  });

  it("ne récompense pas un moteur qui répond à tout", () => {
    const muet = noter([cas([], []), cas([], [])], 4);
    const bavard = noter([cas(["x"], []), cas(["y"], [])], 4);
    expect(muet.silence).toBe(1);
    expect(bavard.silence).toBe(0);
  });

  it("juge un cas hors corpus sur son silence, pas sur son rang", () => {
    expect(reussi({ attendus: [], rendus: [], rang: 0 })).toBe(true);
    expect(reussi({ attendus: [], rendus: [{ id: "x", source: "S", score: 1, attendu: false }], rang: 0 })).toBe(false);
    expect(reussi({ attendus: ["a"], rendus: [], rang: 0 })).toBe(false);
    expect(reussi({ attendus: ["a"], rendus: [], rang: 2 })).toBe(true);
  });
});

describe("le jeu de questions", () => {
  it("n'attend que des passages qui existent", () => {
    // Un attendu fantôme ferait chuter le rappel sans rapport avec le moteur.
    for (const langue of LANGUES) {
      const connus = new Set(construireCorpus(langue).map((p) => p.id));
      for (const c of EVALUATIONS) {
        for (const id of c.attendus) {
          expect(connus.has(id), `${langue} / ${c.id} → ${id}`).toBe(true);
        }
      }
    }
  });

  it("garde des identifiants uniques", () => {
    const ids = EVALUATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /*
   * Sans cas hors corpus, la mesure de silence n'existe pas, et un moteur qui
   * répond à tout obtiendrait la note maximale. Ce test est là pour que
   * personne ne les supprime en trouvant qu'ils font baisser la moyenne.
   */
  it("garde des questions sans réponse, en nombre suffisant", () => {
    expect(CAS_SANS_REPONSE.length).toBeGreaterThanOrEqual(4);
    expect(CAS_AVEC_REPONSE.length).toBeGreaterThanOrEqual(10);
  });

  it("est écrit dans les deux langues", () => {
    for (const c of EVALUATIONS) {
      expect(c.question.fr.trim(), c.id).not.toBe("");
      expect(c.question.en.trim(), c.id).not.toBe("");
      expect(c.intention.fr.trim(), c.id).not.toBe("");
      expect(c.intention.en.trim(), c.id).not.toBe("");
      expect(c.question.fr, c.id).not.toBe(c.question.en);
    }
  });
});

describe("les résultats publiés", () => {
  const lire = (langue: string) =>
    JSON.parse(
      readFileSync(join(process.cwd(), "public", "data", `evaluation-${langue}.json`), "utf8"),
    ) as Evaluation;

  /**
   * L'anti-dérive, comme pour les vecteurs.
   *
   * La page affiche des chiffres versionnés. S'ils décrivaient un autre jeu de
   * questions, un autre corpus ou un autre seuil, ils seraient faux sans que
   * rien ne casse : c'est exactement le genre d'erreur qu'un site de mesures
   * ne peut pas se permettre.
   */
  it("décrivent le corpus, le jeu et le seuil actuels", () => {
    for (const langue of LANGUES) {
      const e = lire(langue);
      expect(e.passages, langue).toBe(construireCorpus(langue).length);
      expect(e.seuil, langue).toBe(SEUIL_PERTINENCE);
      expect(
        e.cas.map((c) => c.id),
        langue,
      ).toEqual(EVALUATIONS.map((c) => c.id));
    }
  });

  it("portent un bilan cohérent avec le détail des cas", () => {
    for (const langue of LANGUES) {
      const e = lire(langue);
      // Le bilan publié est recalculé depuis les cas publiés : s'il avait été
      // écrit à la main, ou produit par une autre version du code, l'écart
      // apparaîtrait ici.
      const recalcule = noter(
        e.cas.map((c) => ({ id: c.id, rendus: c.rendus.map((r) => r.id), attendus: c.attendus })),
        e.bilan.k,
      );
      expect(recalcule.rappel, langue).toBeCloseTo(e.bilan.rappel, 10);
      expect(recalcule.mrr, langue).toBeCloseTo(e.bilan.mrr, 10);
      expect(recalcule.precision, langue).toBeCloseTo(e.bilan.precision, 10);
      expect(recalcule.silence, langue).toBeCloseTo(e.bilan.silence, 10);
    }
  });

  it("portent la courbe complète du seuil, dont le point retenu", () => {
    for (const langue of LANGUES) {
      const e = lire(langue);
      expect(e.courbe.map((p) => p.seuil), langue).toEqual(SEUILS_BALAYES);
      const retenu = e.courbe.find((p) => p.seuil === SEUIL_PERTINENCE);
      expect(retenu, langue).toBeDefined();
      // Au seuil retenu, la courbe doit retrouver le bilan principal.
      expect(retenu!.rappel, langue).toBeCloseTo(e.bilan.rappel, 3);
      expect(retenu!.silence, langue).toBeCloseTo(e.bilan.silence, 3);
    }
  });

  /*
   * Un garde-fou, pas un objectif.
   *
   * Le seuil est posé bien en dessous des valeurs constatées (71 % et 79 % de
   * rappel selon la langue). Il attrape un effondrement — un modèle changé, un
   * corpus recoupé, une pondération cassée — sans transformer la page en
   * course au chiffre, ce qui reviendrait à optimiser sur dix-huit questions.
   */
  it("ne s'effondrent pas silencieusement", () => {
    for (const langue of LANGUES) {
      const e = lire(langue);
      expect(e.bilan.rappel, langue).toBeGreaterThan(0.5);
      expect(e.bilan.silence, langue).toBeGreaterThan(0.5);
      expect(e.bilan.mrr, langue).toBeGreaterThan(0.35);
    }
  });
});
