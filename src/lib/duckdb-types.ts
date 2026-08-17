/**
 * Types et constantes de la console SQL, **sans aucune dépendance à DuckDB**.
 *
 * Ce fichier existe pour une seule raison : la palette de commandes doit
 * pouvoir afficher son interface, ses exemples de requêtes et ses états de
 * chargement sans qu'un seul octet de `@duckdb/duckdb-wasm` n'entre dans le
 * lot initial. Importer `lib/duckdb.ts` — même uniquement pour un type —
 * suffirait à tirer le module dans le graphe de dépendances.
 */

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

export const LIBELLE_ETAPE: Record<EtapeChargement, string> = {
  inactif: "",
  telechargement: "Téléchargement du moteur…",
  instanciation: "Démarrage du moteur…",
  donnees: "Chargement des tables…",
  pret: "Prêt",
  echec: "Échec",
};

/** Requêtes proposées à qui n'écrit pas de SQL — et qui montrent le schéma. */
export const REQUETES_TYPES: { libelle: string; sql: string }[] = [
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
];
