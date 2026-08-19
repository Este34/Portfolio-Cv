import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { MAX_TOURS, type Action, type Etape } from "@/lib/agent-types";
import {
  decideurAvecRepli,
  executerAgent,
  oublierDisponibilite,
  planificateurDeterministe,
  requeteDeLecture,
  resumerObservation,
  TECHNOS,
  type Outillage,
} from "@/lib/agent";
import { cibles, resoudreCible } from "@/lib/cibles";
import { SCHEMA_TABLES } from "@/lib/duckdb-types";
import type { ResultatRequete } from "@/lib/duckdb-types";

/**
 * L'agent : ce que ces tests attrapent.
 *
 * Une boucle d'agent échoue de trois façons, et aucune ne se voit à l'écran
 * quand on la regarde marcher une fois. Elle peut ne pas terminer, ce qui sur
 * un régime facturé coûte de l'argent. Elle peut exécuter ce qu'un modèle a
 * écrit sans le valider, ce qui n'est plus un agent mais une porte. Et elle
 * peut perdre silencieusement sa trace en cas de panne, auquel cas le visiteur
 * voit une réponse tomber de nulle part.
 *
 * Les outils sont injectés, donc rien ici ne touche au réseau, à DuckDB ni au
 * modèle de vectorisation.
 */

/* -------------------------------------------------------------------------- */
/* Outillage de test                                                           */
/* -------------------------------------------------------------------------- */

function table(colonnes: string[], lignes: unknown[][]): ResultatRequete {
  return { colonnes, lignes, duree: 0 };
}

function outillageFactice(reponses: Partial<Outillage> = {}) {
  const appels: { outil: string; argument: string }[] = [];
  const outillage: Outillage = {
    chercher: async (q) => {
      appels.push({ outil: "chercher", argument: q });
      if (reponses.chercher) return reponses.chercher(q);
      return [{ id: "methode-garde", texte: "Un passage.", source: "Méthode", href: "/fr/methode", score: 0.5 }];
    },
    sql: async (r) => {
      appels.push({ outil: "sql", argument: r });
      if (reponses.sql) return reponses.sql(r);
      return table(["n"], [[3]]);
    },
    naviguer: async (c) => {
      appels.push({ outil: "naviguer", argument: c.href });
      await reponses.naviguer?.(c);
    },
  };
  return { outillage, appels };
}

const base = { langue: "fr" as const, regime: "deterministe" as const };

/* -------------------------------------------------------------------------- */

describe("la boucle", () => {
  it("s'arrête au premier « repondre »", async () => {
    const { outillage, appels } = outillageFactice();
    const resultat = await executerAgent({
      ...base,
      question: "peu importe",
      outillage,
      decider: async () => ({ outil: "repondre", argument: "Voilà." }),
    });

    expect(resultat.etapes).toHaveLength(1);
    expect(resultat.reponse).toBe("Voilà.");
    expect(appels).toHaveLength(0);
  });

  /**
   * Le plafond, et pourquoi il est vérifié plutôt que documenté.
   *
   * Un décideur qui ne conclut jamais est le mode d'échec le plus banal : le
   * modèle relance le même outil, observe la même chose, relance. En régime
   * facturé, une boucle sans plafond est une facture sans plafond.
   */
  it("s'arrête au plafond de tours si personne ne conclut", async () => {
    const { outillage } = outillageFactice();
    const resultat = await executerAgent({
      ...base,
      question: "peu importe",
      outillage,
      decider: async () => ({ outil: "chercher", argument: "encore" }),
    });

    expect(resultat.etapes).toHaveLength(MAX_TOURS);
    expect(resultat.reponse).toBeNull();
  });

  it("garde la trace quand le décideur tombe en panne", async () => {
    const { outillage } = outillageFactice();
    let tour = 0;
    const resultat = await executerAgent({
      ...base,
      question: "peu importe",
      outillage,
      decider: async () => {
        tour++;
        if (tour === 1) return { outil: "chercher", argument: "quelque chose" };
        throw new Error("amont injoignable");
      },
    });

    // La recherche du premier tour survit à la panne du second.
    expect(resultat.etapes[0].action.outil).toBe("chercher");
    expect(resultat.etapes[0].observation.type).toBe("extraits");
    expect(resultat.etapes[1].observation).toEqual({
      type: "erreur",
      message: "amont injoignable",
    });
  });

  it("transforme une panne d'outil en observation plutôt qu'en arrêt", async () => {
    const { outillage } = outillageFactice({
      sql: async () => {
        throw new Error("table absente");
      },
    });
    let tour = 0;
    const resultat = await executerAgent({
      ...base,
      question: "peu importe",
      outillage,
      decider: async (): Promise<Action> =>
        ++tour === 1
          ? { outil: "sql", argument: "SELECT 1" }
          : { outil: "repondre", argument: "Je n'ai pas pu." },
    });

    expect(resultat.etapes[0].observation).toEqual({ type: "erreur", message: "table absente" });
    expect(resultat.reponse).toBe("Je n'ai pas pu.");
  });
});

describe("la navigation", () => {
  /**
   * Le test qui compte le plus de ce fichier.
   *
   * L'argument de `naviguer` vient d'un modèle. S'il suffisait qu'il ait la
   * forme d'un chemin, `/fr/../..%2Failleurs` passerait. La cible est donc
   * comparée à la liste construite depuis le contenu, et tout ce qui n'y est
   * pas est refusé **sans être passé à l'outil**.
   */
  it("refuse toute cible absente de la liste du site", async () => {
    const hors = [
      "https://example.com",
      "/fr/../../ailleurs",
      "/fr/admin",
      "javascript:alert(1)",
      "//evil.test/fr",
      "",
    ];

    for (const cible of hors) {
      const { outillage, appels } = outillageFactice();
      const resultat = await executerAgent({
        ...base,
        question: "peu importe",
        outillage,
        decider: async () => ({ outil: "naviguer", argument: cible }),
        maxTours: 1,
      });

      expect(resultat.etapes[0].observation.type, cible).toBe("erreur");
      expect(appels, cible).toHaveLength(0);
    }
  });

  it("accepte un chemin réel du site, et son libellé", async () => {
    const cible = cibles("fr")[0];
    expect(resoudreCible(cible.href, "fr")?.href).toBe(cible.href);
    expect(resoudreCible(cible.label, "fr")?.href).toBe(cible.href);
    expect(resoudreCible(cible.label.toUpperCase(), "fr")?.href).toBe(cible.href);
  });

  it("appelle bien l'outil quand la cible existe", async () => {
    const cible = cibles("fr")[0];
    const { outillage, appels } = outillageFactice();
    await executerAgent({
      ...base,
      question: "peu importe",
      outillage,
      decider: async () => ({ outil: "naviguer", argument: cible.href }),
      maxTours: 1,
    });
    expect(appels).toEqual([{ outil: "naviguer", argument: cible.href }]);
  });
});

describe("le garde SQL", () => {
  it("laisse passer la lecture", () => {
    for (const sql of [
      "SELECT 1",
      "  select titre from travaux ",
      "WITH x AS (SELECT 1) SELECT * FROM x",
      "DESCRIBE travaux",
      "SELECT count(*) FROM travaux;",
    ]) {
      expect(requeteDeLecture(sql), sql).toBe(true);
    }
  });

  it("refuse l'écriture, y compris déguisée", () => {
    for (const sql of [
      "DROP TABLE travaux",
      "INSERT INTO travaux VALUES (1)",
      "UPDATE travaux SET titre = 'x'",
      "DELETE FROM travaux",
      "SELECT 1; DROP TABLE travaux",
      "-- select\nDROP TABLE travaux",
      "/* select */ DELETE FROM travaux",
      "",
      "   ",
    ]) {
      expect(requeteDeLecture(sql), sql).toBe(false);
    }
  });

  it("ne passe jamais une écriture à l'outil", async () => {
    const { outillage, appels } = outillageFactice();
    const resultat = await executerAgent({
      ...base,
      question: "peu importe",
      outillage,
      decider: async () => ({ outil: "sql", argument: "DROP TABLE travaux" }),
      maxTours: 1,
    });
    expect(resultat.etapes[0].observation.type).toBe("erreur");
    expect(appels).toHaveLength(0);
  });
});

describe("le planificateur déterministe", () => {
  it("tire son vocabulaire du contenu", () => {
    // Une liste écrite à la main serait juste le jour où on l'écrit.
    expect(TECHNOS).toContain("Python");
    expect(TECHNOS.length).toBeGreaterThan(20);
  });

  it("choisit une requête pour dénombrer", async () => {
    const decider = planificateurDeterministe();
    const action = await decider({
      question: "Combien de projets utilisent Python ?",
      langue: "fr",
      etapes: [],
    });
    expect(action.outil).toBe("sql");
    expect(action.argument).toContain("count");
    expect(action.argument).toContain("Python");
  });

  it("choisit une navigation quand la page est nommée", async () => {
    const cible = cibles("fr").find((c) => c.label.toLowerCase().includes("labo"));
    const decider = planificateurDeterministe();
    const action = await decider({
      question: `Ouvre la page ${cible!.label}`,
      langue: "fr",
      etapes: [],
    });
    expect(action).toMatchObject({ outil: "naviguer", argument: cible!.href });
  });

  it("choisit la recherche par défaut", async () => {
    const decider = planificateurDeterministe();
    const action = await decider({
      question: "Comment vérifie-t-il que son code est juste ?",
      langue: "fr",
      etapes: [],
    });
    expect(action.outil).toBe("chercher");
  });

  /**
   * Les quatre tâches proposées doivent aboutir, et pas seulement ne pas
   * planter : une démonstration dont les exemples ne concluent pas est pire
   * qu'une démonstration sans exemples.
   */
  it("conclut sur chacune des quatre intentions", async () => {
    const cible = cibles("fr").find((c) => c.label.toLowerCase().includes("labo"))!;
    const taches = [
      "Combien de projets utilisent Python ?",
      "Comment vérifie-t-il que son code est juste ?",
      `Ouvre la page ${cible.label}`,
      "Quel projet a le plus de technologies, et ouvre-le",
    ];

    for (const question of taches) {
      const { outillage } = outillageFactice({
        sql: async (r) =>
          r.includes("count")
            ? table(["n"], [[3]])
            : table(["titre", "nb_technos"], [[cibles("fr").at(-1)!.label, 9]]),
      });

      const resultat = await executerAgent({
        ...base,
        question,
        outillage,
        decider: planificateurDeterministe(),
      });

      expect(resultat.reponse, question).toBeTruthy();
      expect(resultat.etapes.length, question).toBeLessThanOrEqual(MAX_TOURS);
    }
  });

  it("enchaîne trois outils sur « le plus … et ouvre-le »", async () => {
    const dernier = cibles("fr").at(-1)!;
    const { outillage } = outillageFactice({
      sql: async () => table(["titre", "nb_technos"], [[dernier.label, 9]]),
    });

    const resultat = await executerAgent({
      ...base,
      question: "Quel projet a le plus de technologies, et ouvre-le",
      outillage,
      decider: planificateurDeterministe(),
    });

    expect(resultat.etapes.map((e) => e.action.outil)).toEqual(["sql", "naviguer", "repondre"]);
    expect(resultat.reponse).toContain(dernier.label);
  });
});

describe("le repli", () => {
  beforeEach(() => oublierDisponibilite());

  it("bascule sur le déterministe quand le modèle tombe, sans perdre la trace", async () => {
    // Pas de serveur ici : `fetch` échoue, ce qui est exactement le cas qu'on
    // veut couvrir — route absente, sans clé, ou hors ligne.
    const { outillage } = outillageFactice();
    const { decider, bilan } = decideurAvecRepli();

    const resultat = await executerAgent({
      langue: "fr",
      regime: "deterministe",
      question: "Comment vérifie-t-il que son code est juste ?",
      outillage,
      decider,
    });

    expect(resultat.reponse).toBeTruthy();
    expect(resultat.etapes[0].action.outil).toBe("chercher");
    // Le modèle n'a jamais servi : ce n'est pas un repli, c'est le mode normal
    // d'un déploiement sans clé, et l'annoncer comme une panne serait faux.
    expect(bilan()).toEqual({ regime: "deterministe", repli: false });
  });
});

describe("le résumé envoyé au modèle", () => {
  it("borne ce qui part sur le réseau", () => {
    const lignes = Array.from({ length: 500 }, (_, i) => [i, "x".repeat(50)]);
    const resume = resumerObservation(
      { type: "table", resultat: table(["i", "v"], lignes) },
      "fr",
    );
    expect(resume.split("\n").length).toBeLessThan(25);
    expect(resume).toContain("500 lignes au total");
  });

  it("ne recopie pas un passage entier", () => {
    const resume = resumerObservation(
      {
        type: "extraits",
        extraits: [{ id: "x", texte: "z".repeat(5000), source: "S", href: "/fr", score: 0.9 }],
      },
      "fr",
    );
    expect(resume.length).toBeLessThan(600);
  });
});

describe("le schéma", () => {
  /**
   * L'anti-dérive.
   *
   * Le schéma décrit au modèle est une constante ; les tables, elles, sont
   * produites par un script. Une colonne ajoutée d'un côté et pas de l'autre
   * ferait écrire des requêtes qui échouent, et l'échec ressemblerait à une
   * hallucination du modèle plutôt qu'à ce qu'il serait : une documentation
   * périmée.
   */
  it("décrit exactement les tables réellement générées", () => {
    const chemin = join(process.cwd(), "public", "data", "portfolio-fr.json");
    const donnees = JSON.parse(readFileSync(chemin, "utf8")) as Record<
      string,
      Record<string, unknown>[]
    >;

    expect(Object.keys(donnees).sort()).toEqual(Object.keys(SCHEMA_TABLES).sort());

    for (const [table, colonnes] of Object.entries(SCHEMA_TABLES)) {
      const lignes = donnees[table];
      expect(lignes.length, table).toBeGreaterThan(0);
      expect(Object.keys(lignes[0]).sort(), table).toEqual([...colonnes].sort());
    }
  });
});

describe("la trace", () => {
  it("numérote les tours à partir de un, sans trou", async () => {
    const { outillage } = outillageFactice();
    let tour = 0;
    const resultat = await executerAgent({
      ...base,
      question: "peu importe",
      outillage,
      decider: async (): Promise<Action> =>
        ++tour < 3
          ? { outil: "chercher", argument: "encore" }
          : { outil: "repondre", argument: "fini" },
    });

    const tours: Etape["tour"][] = resultat.etapes.map((e) => e.tour);
    expect(tours).toEqual([1, 2, 3]);
  });
});
