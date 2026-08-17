import { describe, expect, it } from "vitest";

import { EXTENSIONS_ACCEPTEES, nomTable } from "../src/lib/duckdb.ts";

/**
 * Tests du nettoyage de nom de table.
 *
 * Cette fonction est la frontière entre un nom de fichier — que le visiteur
 * choisit et qui peut contenir n'importe quoi — et un identifiant SQL qu'il va
 * devoir taper. Une erreur ici ne casse rien visiblement : elle produit une
 * table qu'on n'arrive pas à interroger, et le visiteur croit que l'outil ne
 * marche pas.
 */
describe("nomTable", () => {
  it("met en minuscules et remplace les séparateurs", () => {
    expect(nomTable("Ventes Régionales.csv")).toBe("ventes_regionales");
  });

  it("retire les accents plutôt que de les supprimer avec leur lettre", () => {
    // Le piège : une décomposition mal faite transformerait « données » en
    // « donnes » et le visiteur ne retrouverait pas sa table.
    expect(nomTable("données_été.parquet")).toBe("donnees_ete");
  });

  it("réduit la ponctuation à un seul tiret bas", () => {
    expect(nomTable("bilan -- 2024 (final).csv")).toBe("bilan_2024_final");
  });

  it("ne laisse pas de tiret bas en tête ni en fin", () => {
    expect(nomTable("__brut__.csv")).toBe("brut");
  });

  it("préfixe les noms commençant par un chiffre", () => {
    // `SELECT * FROM 2024_bilan` est une erreur de syntaxe SQL.
    expect(nomTable("2024-bilan.json")).toBe("t_2024_bilan");
  });

  it("conserve une lettre unique, qui reste un identifiant valide", () => {
    // « é » se réduit à « e » : court, mais parfaitement interrogeable.
    expect(nomTable("é.csv")).toBe("e");
  });

  it("se rabat sur un nom par défaut quand il ne reste rien", () => {
    expect(nomTable("---.csv")).toBe("t_donnees");
    expect(nomTable("...csv")).toBe("t_donnees");
  });

  it("gère un nom sans extension", () => {
    expect(nomTable("donnees")).toBe("donnees");
  });

  it("conserve les points intermédiaires comme séparateurs", () => {
    expect(nomTable("export.v2.final.csv")).toBe("export_v2_final");
  });

  it("annonce les formats que l'interface propose", () => {
    for (const f of ["csv", "tsv", "json", "ndjson", "parquet", "txt"]) {
      expect(EXTENSIONS_ACCEPTEES).toContain(f);
    }
  });
});
