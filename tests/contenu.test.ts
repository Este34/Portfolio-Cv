import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { construireCorpus } from "../src/content/corpus.ts";
import { TRAVAUX, stackAgregee, travailParSlug } from "../src/content/travaux.ts";
import { CONTACT, NAV_ITEMS, SITE } from "../src/lib/site.ts";

/**
 * Tests du contenu et de ses dérivés.
 *
 * Le contenu est la source de vérité de trois artefacts — pages statiques,
 * tables SQL, corpus vectoriel. Une incohérence entre eux ne casse rien
 * bruyamment : elle produit un site qui se contredit lui-même.
 */

describe("travaux", () => {
  it("les slugs sont uniques", () => {
    const slugs = TRAVAUX.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("les rangs sont uniques et contigus depuis 1", () => {
    const rangs = [...TRAVAUX.map((t) => t.rang)].sort((a, b) => a - b);
    expect(rangs).toEqual(TRAVAUX.map((_, i) => i + 1));
  });

  it("chaque travail est retrouvable par son slug", () => {
    for (const t of TRAVAUX) expect(travailParSlug(t.slug)?.titre).toBe(t.titre);
  });

  it("chaque travail porte un récit complet", () => {
    for (const t of TRAVAUX) {
      expect(t.contexte.length, t.slug).toBeGreaterThan(80);
      expect(t.contraintes.length, t.slug).toBeGreaterThan(0);
      expect(t.decisions.length, t.slug).toBeGreaterThan(0);
      expect(t.resultats.length, t.slug).toBeGreaterThan(0);
      expect(t.stack.length, t.slug).toBeGreaterThan(0);
    }
  });

  it("chaque décision est justifiée", () => {
    // Une décision sans raison n'a aucune valeur sur un portfolio : c'est la
    // justification qu'un recruteur lit, pas le choix.
    for (const t of TRAVAUX) {
      for (const d of t.decisions) {
        expect(d.raison.length, `${t.slug} — ${d.choix}`).toBeGreaterThan(60);
      }
    }
  });

  it("seuls les travaux publics exposent des liens", () => {
    for (const t of TRAVAUX) {
      if (t.confidentialite === "anonymise") {
        expect(t.liens.depot, t.slug).toBeUndefined();
        expect(t.liens.demo, t.slug).toBeUndefined();
      }
    }
  });

  it("agrège la stack par fréquence décroissante", () => {
    const agregee = stackAgregee();
    const occurrences = agregee.map((s) => s.occurrences);
    expect(occurrences).toEqual([...occurrences].sort((a, b) => b - a));
    expect(agregee.find((s) => s.nom === "Python")?.occurrences).toBeGreaterThan(1);
  });
});

describe("identité du site", () => {
  it("les chemins de navigation sont uniques", () => {
    const hrefs = NAV_ITEMS.map((n) => n.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("n'expose ni adresse postale ni numéro de téléphone", () => {
    // Un portfolio est indexé et archivé ; une adresse personnelle y devient
    // permanente. Le courriel suffit et se change.
    const serialise = JSON.stringify({ SITE, CONTACT });
    expect(serialise).not.toMatch(/\b0[1-9]([ .-]?\d{2}){4}\b/);
    /*
     * Le groupe de cinq chiffres ne doit pas être bordé d'un séparateur
     * décimal : sans cette précaution, « 0,00002 % » passait pour un code
     * postal et le test échouait sur une donnée parfaitement légitime.
     */
    expect(serialise).not.toMatch(/(?<![\d.,])\d{5}(?![\d.,])/);
  });
});

describe("corpus dérivé", () => {
  const corpus = construireCorpus();

  it("les identifiants de passage sont uniques", () => {
    const ids = corpus.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque passage porte une source et un lien", () => {
    for (const p of corpus) {
      expect(p.source.length, p.id).toBeGreaterThan(0);
      expect(p.href.startsWith("/"), p.id).toBe(true);
      expect(p.texte.length, p.id).toBeGreaterThan(40);
    }
  });

  it("chaque travail est représenté dans le corpus", () => {
    for (const t of TRAVAUX) {
      expect(corpus.some((p) => p.href === `/travaux/${t.slug}`), t.slug).toBe(true);
    }
  });
});

describe("tables SQL générées", () => {
  it("portfolio.json contient les sept tables attendues", async () => {
    const brut = await readFile(join(process.cwd(), "public", "data", "portfolio.json"), "utf8");
    const donnees = JSON.parse(brut) as Record<string, unknown[]>;

    expect(Object.keys(donnees).sort()).toEqual(
      ["chiffres", "competences", "decisions", "domaines", "parcours", "stack", "travaux"].sort(),
    );
    expect(donnees.travaux.length).toBe(TRAVAUX.length);
    for (const [table, lignes] of Object.entries(donnees)) {
      expect(lignes.length, table).toBeGreaterThan(0);
    }
  });
});
