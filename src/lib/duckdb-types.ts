/**
 * Types et constantes de la console SQL, **sans aucune dépendance à DuckDB**.
 *
 * Ce fichier existe pour une seule raison : la palette de commandes doit
 * pouvoir afficher son interface, ses exemples de requêtes et ses états de
 * chargement sans qu'un seul octet de `@duckdb/duckdb-wasm` n'entre dans le
 * lot initial. Importer `lib/duckdb.ts` — même uniquement pour un type —
 * suffirait à tirer le module dans le graphe de dépendances.
 */

import type { Langue } from "./langue";

export type EtapeChargement =
  | "inactif"
  | "telechargement"
  | "instanciation"
  | "donnees"
  | "pret"
  | "echec";

export type ResultatRequete = {
  colonnes: string[];
  lignes: unknown[][];
  duree: number;
};

export const LIBELLE_ETAPE: Record<Langue, Record<EtapeChargement, string>> = {
  fr: {
    inactif: "",
    telechargement: "Téléchargement du moteur…",
    instanciation: "Démarrage du moteur…",
    donnees: "Chargement des tables…",
    pret: "Prêt",
    echec: "Échec",
  },
  en: {
    inactif: "",
    telechargement: "Downloading the engine…",
    instanciation: "Starting the engine…",
    donnees: "Loading the tables…",
    pret: "Ready",
    echec: "Failed",
  },
};

/**
 * Requêtes proposées à qui n'écrit pas de SQL — et qui montrent le schéma.
 *
 * **Le SQL n'est pas traduit, et c'est un choix.** Les noms de tables et de
 * colonnes viennent du générateur de données ; les traduire supposerait deux
 * schémas, donc deux bases, pour un contenu identique. Un anglophone qui écrit
 * du SQL lit `titre` et `annee` sans difficulté. Seul le libellé de l'exemple
 * change de langue.
 */
export const REQUETES_TYPES: Record<Langue, { libelle: string; sql: string }[]> = {
  fr: [
    {
      libelle: "Tous les travaux, du plus récent",
      sql: "SELECT titre, annee, diffusion, nb_technos\nFROM travaux\nORDER BY rang",
    },
    {
      libelle: "Les technologies les plus employées",
      sql: "SELECT techno, count(*) AS projets\nFROM stack\nGROUP BY techno\nHAVING count(*) > 1\nORDER BY projets DESC, techno",
    },
    {
      libelle: "Où est-ce que je fais du Python ?",
      sql: "SELECT t.titre, t.annee\nFROM travaux t\nJOIN stack s USING (slug)\nWHERE s.techno = 'Python'\nORDER BY t.rang",
    },
    {
      libelle: "Les décisions techniques, et pourquoi",
      sql: "SELECT t.titre, d.choix\nFROM decisions d\nJOIN travaux t USING (slug)\nORDER BY t.rang, d.rang",
    },
    {
      libelle: "Compétences par famille",
      sql: "SELECT famille, string_agg(competence, ', ') AS competences\nFROM competences\nGROUP BY famille",
    },
    {
      libelle: "Le schéma complet",
      sql: "SELECT table_name, column_name, data_type\nFROM information_schema.columns\nORDER BY table_name, ordinal_position",
    },
  ],
  en: [
    {
      libelle: "Every project, newest first",
      sql: "SELECT titre, annee, diffusion, nb_technos\nFROM travaux\nORDER BY rang",
    },
    {
      libelle: "The most-used technologies",
      sql: "SELECT techno, count(*) AS projets\nFROM stack\nGROUP BY techno\nHAVING count(*) > 1\nORDER BY projets DESC, techno",
    },
    {
      libelle: "Where do I write Python?",
      sql: "SELECT t.titre, t.annee\nFROM travaux t\nJOIN stack s USING (slug)\nWHERE s.techno = 'Python'\nORDER BY t.rang",
    },
    {
      libelle: "Technical decisions, and why",
      sql: "SELECT t.titre, d.choix\nFROM decisions d\nJOIN travaux t USING (slug)\nORDER BY t.rang, d.rang",
    },
    {
      libelle: "Skills by family",
      sql: "SELECT famille, string_agg(competence, ', ') AS competences\nFROM competences\nGROUP BY famille",
    },
    {
      libelle: "The full schema",
      sql: "SELECT table_name, column_name, data_type\nFROM information_schema.columns\nORDER BY table_name, ordinal_position",
    },
  ],
};

/**
 * Le schéma des tables, source unique.
 *
 * Il était décrit à trois endroits : la liste des tables affichée dans la
 * console, les consignes envoyées au modèle de l'agent, et la tête du
 * générateur. Trois copies d'une même vérité, dont deux finissent toujours par
 * dater. Ici il n'y en a qu'une, et un test unitaire la confronte au JSON
 * réellement produit par `scripts/generer-donnees.ts`.
 *
 * Ce qui se produirait sans ce test mérite d'être nommé : une colonne ajoutée
 * au générateur et pas ici ferait écrire au modèle des requêtes qui échouent,
 * et l'échec ressemblerait à une hallucination alors que ce serait une dérive
 * de documentation.
 */
export const SCHEMA_TABLES = {
  travaux: [
    "slug",
    "titre",
    "sous_titre",
    "resume",
    "annee",
    "role",
    "diffusion",
    "rang",
    "nb_technos",
    "nb_decisions",
  ],
  stack: ["slug", "techno", "annee"],
  domaines: ["slug", "domaine"],
  chiffres: ["slug", "valeur", "libelle", "note"],
  decisions: ["slug", "rang", "choix", "raison"],
  competences: ["famille", "competence"],
  parcours: ["periode", "titre", "lieu", "description"],
} as const satisfies Record<string, readonly string[]>;

export const NOMS_TABLES = Object.keys(SCHEMA_TABLES);

/** Le schéma en une ligne par table, tel qu'il est donné au modèle. */
export const SCHEMA_TEXTE = Object.entries(SCHEMA_TABLES)
  .map(([table, colonnes]) => `${table}(${colonnes.join(", ")})`)
  .join("\n");
