/**
 * Bilinguisme du site.
 *
 * ## Le choix de forme, et pourquoi
 *
 * Chaque chaîne traduisible est un objet `{ fr, en }` plutôt qu'une clé pointant
 * vers deux fichiers de traduction séparés. C'est plus verbeux à l'écriture, et
 * c'est délibéré : le type rend **impossible** d'ajouter du contenu français
 * sans sa traduction, et les deux versions restent côte à côte, donc une
 * retouche de l'une se fait sous les yeux de l'autre.
 *
 * Deux fichiers parallèles auraient l'avantage inverse : agréables à traduire
 * d'un bloc, et silencieusement désynchronisés au bout de trois modifications.
 * Sur un portfolio tenu par une seule personne, la dérive est la panne la plus
 * probable.
 *
 * ## Les URL
 *
 * Toutes les pages vivent sous `/fr/…` ou `/en/…`. La racine redirige vers le
 * français (voir `next.config.ts`). Aucune négociation par `Accept-Language` :
 * elle exige un middleware, donc du code exécuté à chaque visite d'un site par
 * ailleurs entièrement statique, et elle produit surtout des surprises — un
 * lecteur qui envoie un lien à un collègue n'attend pas que la page change de
 * langue en route.
 */

export const LANGUES = ["fr", "en"] as const;

export type Langue = (typeof LANGUES)[number];

export const LANGUE_DEFAUT: Langue = "fr";

/** Une chaîne dans les deux langues. */
export type Bilingue = { readonly fr: string; readonly en: string };

export function estLangue(valeur: string | undefined): valeur is Langue {
  return valeur === "fr" || valeur === "en";
}

/** Résout une chaîne bilingue. */
export function t(valeur: Bilingue, langue: Langue): string {
  return valeur[langue];
}

/** Résout une liste de chaînes bilingues. */
export function ts(valeurs: readonly Bilingue[], langue: Langue): string[] {
  return valeurs.map((v) => v[langue]);
}

/**
 * Préfixe un chemin interne par la langue.
 *
 * Passer par cette fonction plutôt que d'écrire `/fr/travaux` en dur : c'est ce
 * qui garantit qu'un lien posé dans un gabarit partagé reste dans la langue de
 * la page qui l'affiche.
 */
export function lien(chemin: string, langue: Langue): string {
  if (chemin === "/") return `/${langue}`;
  return `/${langue}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;
}

/** L'autre langue. Utilisé par la bascule de l'en-tête. */
export function autreLangue(langue: Langue): Langue {
  return langue === "fr" ? "en" : "fr";
}

/** Étiquette de langue au format BCP 47, pour `<html lang>` et Open Graph. */
export const ETIQUETTE: Record<Langue, { html: string; og: string; nom: string }> = {
  fr: { html: "fr-FR", og: "fr_FR", nom: "Français" },
  en: { html: "en", og: "en_US", nom: "English" },
};

/**
 * Format des nombres selon la langue.
 *
 * Ce n'est pas de la coquetterie : « 0,00002 % » est illisible pour un lecteur
 * anglophone, qui lit la virgule comme un séparateur de milliers. Le chiffre le
 * plus important du site ne peut pas se permettre cette ambiguïté.
 */
export function locale(langue: Langue): string {
  return langue === "fr" ? "fr-FR" : "en-US";
}
