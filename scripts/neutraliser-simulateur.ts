/**
 * Produit une version publiable et neutralisée du simulateur numérique.
 *
 * ## À lire avant de lancer
 *
 * Ce script est un **outil local à usage unique**, pas une étape de build. Il
 * lit un dépôt privé présent sur ma machine et écrit son résultat dans
 * `public/demos/`, qui est versionné. L'environnement de build de l'hébergeur
 * n'a pas accès à la source et n'a pas à l'avoir : c'est la sortie qui est
 * publiée, jamais l'entrée.
 *
 * ## Ce qui est conservé, et pourquoi
 *
 * L'intégralité du code, de la mise en page, des graphiques et des interactions.
 * C'est là qu'est le travail, et c'est ce que la démonstration doit montrer.
 * Les clés de structure aussi — « Aluminium », « Smartphones », « Stock » sont
 * du vocabulaire public, pas une information appartenant à quelqu'un.
 *
 * ## Ce qui est remplacé, et pourquoi
 *
 * **Toutes les valeurs numériques sont régénérées.** Elles sont la sortie du
 * modèle de l'employeur : aucune ne part en ligne. Les remplacer intégralement
 * plutôt que les brouiller est la seule garantie vérifiable — un bruit
 * multiplicatif laisserait deviner les ordres de grandeur d'origine.
 *
 * Sont également retirés ou renommés : le nom du modèle, les noms de
 * trajectoires, les territoires, les logos, les cartes, la police et les
 * couleurs du design system de l'État — cette dernière étant à elle seule un
 * indice d'appartenance.
 *
 * Usage : node scripts/neutraliser-simulateur.ts [chemin/vers/source]
 */

import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = process.argv[2] ?? "D:/CEA/Site-CVI/Num-Icare";
const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const CIBLE = join(RACINE, "public", "demos", "simulateur-numerique");

/* ---------------------------------------------------------------------------
   1. Substitutions textuelles
   --------------------------------------------------------------------------- */

/**
 * Ordre significatif : les expressions les plus longues d'abord, sinon une
 * substitution courte mange le préfixe d'une plus longue et laisse un résidu.
 */
const REMPLACEMENTS: [RegExp, string][] = [
  // Nom du modèle. Le motif générique vient en dernier : il rattrape les
  // formulations libres du genre « Trajectoire Icare », que les motifs
  // spécifiques laissaient passer.
  [/Num['’]Icare/gi, "Simulateur numérique"],
  [/numicare/gi, "simulateurNumerique"],

  // Noms de trajectoires — « Icare » désigne le modèle.
  [/T4 Icare/g, "S4 Rupture"],
  [/T3 Numérisation/g, "S3 Expansion"],
  [/T2 Maintien/g, "S2 Tendanciel"],
  [/T1 Low tech/g, "S1 Sobriété"],
  [/T['’] Libre/g, "S′ Libre"],

  // Territoires. Les gentilés d'abord : « française » ne contient pas
  // « France » au sens d'une borne de mot, et survivait aux règles suivantes.
  [/française/gi, "nationale"],
  [/françaises/gi, "nationales"],
  [/français/gi, "national"],
  [/République\s*(<br\s*\/?>)?\s*Nationale/gi, ""],
  [/France entière/g, "Territoire national"],
  [/\bOccitanie\b/g, "Territoire régional"],
  [/région Occitanie/gi, "territoire régional"],
  [/\bla France\b/g, "le territoire"],
  [/\ben France\b/g, "sur le territoire"],
  [/\bFrance\b/g, "territoire"],
  [/carte_france_region_occitanie\.png/g, ""],
  [/carte_france\.png/g, ""],

  /*
   * Chemins d'assets AVANT les noms d'organisme.
   *
   * Dans l'autre ordre, la règle générique transformait « isec » en
   * « institut » : « assets/isec.svg » devenait « assets/institut.svg », que
   * les règles suivantes ne reconnaissaient plus, et l'application partait en
   * ligne en réclamant un fichier inexistant.
   */
  [/banniere_Isec\.jpg/gi, ""],
  [/assets\/(cea|isec)\.svg/gi, ""],
  [/assets\/(cea|isec)\.png/gi, ""],

  // Organisme — insensible à la casse : les feuilles de style emploient les
  // formes minuscules dans les noms de classes et de jetons, que des motifs
  // sensibles à la casse laissaient passer.
  [/CEA-?Isec/gi, "institut"],
  [/\bisec\b/gi, "institut"],
  [/\bcea\b/gi, "institut"],
  /*
   * Nom de l'équipe. Absent de ma première liste, il a été rattrapé par le
   * garde-fou d'anonymat au moment du build, dans un pied de page :
   * « Source : CVI ». C'est la raison d'être de ce garde-fou — une liste de
   * substitutions écrite à la main a toujours un trou, et l'attraper avant le
   * déploiement plutôt qu'après est tout ce qui compte.
   */
  [/\bcvi\b/gi, "institut"],

  // Source de données démographiques
  [/\bINSEE\b/g, "démographie de référence"],

  // Design system de l'État : jetons, couleurs et police
  [/--blue-france/g, "--bleu-donnees"],
  [/blue-france/g, "bleu-donnees"],
  [/#000091/gi, "#1f3a93"],
  [/#e1000f/gi, "#c2371f"],
  [/#eef0f8/gi, "#eef1f6"],
  [/#e2e6f3/gi, "#e3e7f0"],
  [/marianne/gi, "Inter"],

  // Rattrapage : toute occurrence isolée du nom du modèle.
  [/\bicare\b/gi, "cible"],
];

/**
 * Blocs supprimés entièrement, parce qu'aucune substitution ne les sauve.
 *
 * Le bloc-marque de l'État et le pavé institutionnel de l'organisme ne sont pas
 * des chaînes à réécrire : ce sont des éléments d'identité visuelle, avec leurs
 * liens sortants vers les sites officiels. Renommer leur contenu laisserait la
 * structure, la mise en forme et les liens en place. Ils partent en entier.
 *
 * Les règles `@font-face` disparaissent aussi : la police du design system
 * n'est pas redistribuée, et la renommer laissait l'application réclamer des
 * fichiers absents — quatre requêtes en 404 à chaque chargement.
 */
const BLOCS_SUPPRIMES: [RegExp, string][] = [
  [/<div class="cover-logos">[\s\S]*?<\/div>\s*/g, ""],
  [/<div class="[a-z-]*banner-logos">[\s\S]*?<\/div>\s*/g, ""],
  [/<p class="[a-z-]*banner-text">[\s\S]*?<\/p>\s*/g, ""],
  [/@font-face\s*\{[^}]*\}\s*/g, ""],
  // Liens sortants vers les sites officiels.
  [/https:\/\/(www\.)?(info\.gouv\.fr|isec\.cea\.fr|cea\.fr)[^"']*/g, "#"],
];

/**
 * Balises devenues vides par les substitutions de chemins.
 *
 * Appliquées en dernier, une fois les chemins réécrits — dans l'autre ordre
 * elles ne trouveraient rien. Sans cette passe il restait des images pointant
 * sur le dossier `assets` lui-même, ce que le navigateur traite comme une
 * requête et qui produisait deux 404 à chaque chargement, hérités des cartes
 * territoriales supprimées. C'est l'élément entier qui doit disparaître, pas
 * seulement sa cible.
 */
const BALISES_VIDES: [RegExp, string][] = [
  [/<img[^>]*src="assets\/"[^>]*>\s*/g, ""],
  [/<img[^>]*src=""[^>]*>\s*/g, ""],
];

function neutraliserTexte(contenu: string): string {
  let sortie = contenu;
  for (const [motif, par] of BLOCS_SUPPRIMES) sortie = sortie.replace(motif, par);
  for (const [motif, par] of REMPLACEMENTS) sortie = sortie.replace(motif, par);
  for (const [motif, par] of BALISES_VIDES) sortie = sortie.replace(motif, par);
  return sortie;
}

/* ---------------------------------------------------------------------------
   2. Données de synthèse
   --------------------------------------------------------------------------- */

type Ligne = { t: string; e: string; te: string; m: string; v: number[] };
type LigneElec = { e: string; te: string; v: number[] };

/** Générateur déterministe : régénérer le jeu ne change pas les graphiques. */
function creerAlea(graine: number) {
  const etat = { g: graine };
  return () => {
    etat.g = (etat.g * 1664525 + 1013904223) % 4294967296;
    return etat.g / 4294967296;
  };
}

/**
 * Fabrique une trajectoire plausible sur la période.
 *
 * Les courbes doivent rester crédibles à l'œil — croissance, saturation ou
 * décroissance douce, jamais du bruit blanc — sinon les graphiques trahissent
 * immédiatement que les données sont inventées et la démonstration perd son
 * intérêt. Elles ne prétendent en revanche modéliser quoi que ce soit.
 */
function trajectoire(alea: () => number, annees: number, base: number): number[] {
  const forme = alea();
  const amplitude = 0.35 + alea() * 1.5;
  const courbure = 0.4 + alea() * 2.2;

  return Array.from({ length: annees }, (_, i) => {
    const p = i / (annees - 1);
    let facteur: number;
    if (forme < 0.45) {
      facteur = 1 + amplitude * Math.pow(p, courbure); // croissance
    } else if (forme < 0.75) {
      facteur = 1 + amplitude * (1 - Math.exp(-3 * p)); // saturation
    } else {
      facteur = 1 - 0.55 * Math.pow(p, courbure); // décroissance
    }
    // Ondulation légère : une courbe parfaitement lisse ne ressemble pas à une
    // sortie de modèle.
    const ondulation = 1 + Math.sin(p * 7 + forme * 10) * 0.012;
    return Math.max(0, base * facteur * ondulation);
  });
}

function regenerer(source: Record<string, unknown>): Record<string, unknown> {
  const alea = creerAlea(20260817);
  const annees = (source.years as number[]).length;

  const rows = (source.rows as Ligne[]).map((r) => ({
    t: r.t,
    e: r.e,
    te: r.te,
    m: r.m,
    // Base tirée sur plusieurs ordres de grandeur : les matières critiques
    // pèsent des tonnes là où l'aluminium pèse des milliers.
    v: trajectoire(alea, annees, Math.pow(10, alea() * 5 - 1) * (0.5 + alea())).map(
      (x) => Math.round(x * 1000) / 1000,
    ),
  }));

  const elec = (source.elec as LigneElec[]).map((r) => ({
    e: r.e,
    te: r.te,
    v: trajectoire(alea, annees, Math.pow(10, alea() * 3 - 2)).map((x) => Math.round(x * 1e5) / 1e5),
  }));

  // Production mondiale : ordres de grandeur inventés, cohérents entre eux.
  const prodMap: Record<string, number> = {};
  for (const matiere of Object.keys(source.prodMap as Record<string, number>)) {
    prodMap[matiere] = Math.round(Math.pow(10, 2 + alea() * 7));
  }

  /*
   * Les ratios et seuils territoriaux passent aussi à la synthèse.
   *
   * Ils étaient restés tels quels alors que la page affirme que toutes les
   * valeurs sont régénérées : le poids démographique du territoire régional
   * s'affichait au centième près dans la boîte de dialogue d'accueil. Une
   * affirmation partiellement vraie sur l'anonymisation ne vaut pas mieux
   * qu'une affirmation fausse.
   */
  const regions = (source.regions as { seuils: number[] }[]).map((r, i) => ({
    ...r,
    ratio: i === 0 ? 1 : Math.round((0.06 + alea() * 0.09) * 1e4) / 1e4,
    seuils: r.seuils.map(() => Math.round(alea() * 2e3) / 1e3),
  }));

  return {
    ...source,
    generatedAt: "synthèse",
    rows,
    elec,
    prodMap,
    regions,
    seuils: (source.seuils as number[]).map(() => Math.round(alea() * 2e3) / 1e3),
    /** Marqueur lu par la bannière de l'application. */
    demonstration: true,
  };
}

/* ---------------------------------------------------------------------------
   3. Copie
   --------------------------------------------------------------------------- */

const TEXTE = new Set([".html", ".js", ".css", ".json", ".md", ".svg"]);

/** Assets conservés : tout le reste est écarté par défaut. */
const ASSETS_GARDES = ["DataCenter-1020x512 (1).jpg"];

async function copierDossier(de: string, vers: string, transformer: boolean) {
  await mkdir(vers, { recursive: true });
  for (const entree of await readdir(de, { withFileTypes: true })) {
    const src = join(de, entree.name);
    /*
     * Le nom de fichier subit les mêmes substitutions que son contenu.
     *
     * Sans cela, `index.html` — dont le contenu EST transformé — se mettait à
     * charger `js/simulateurNumerique.js` tandis que le fichier restait nommé
     * `js/numicare.js` : l'application partait en ligne avec un script en 404,
     * donc cassée, et le nom du modèle restait lisible dans l'arborescence.
     */
    const dst = join(vers, transformer ? neutraliserTexte(entree.name) : entree.name);
    if (entree.isDirectory()) {
      await copierDossier(src, dst, transformer);
      continue;
    }
    const ext = entree.name.slice(entree.name.lastIndexOf("."));
    if (transformer && TEXTE.has(ext)) {
      await writeFile(dst, neutraliserTexte(await readFile(src, "utf8")), "utf8");
    } else {
      await copyFile(src, dst);
    }
  }
}

await mkdir(CIBLE, { recursive: true });

// Code : transformé.
for (const dossier of ["js", "css"]) {
  await copierDossier(join(SOURCE, dossier), join(CIBLE, dossier), true);
}
// Bibliothèques tierces : copiées telles quelles, elles n'identifient rien.
await copierDossier(join(SOURCE, "vendor"), join(CIBLE, "vendor"), false);

await writeFile(
  join(CIBLE, "index.html"),
  neutraliserTexte(await readFile(join(SOURCE, "index.html"), "utf8")),
  "utf8",
);

// Assets : liste blanche. Logos, cartes et police du design system écartés.
await mkdir(join(CIBLE, "assets"), { recursive: true });
for (const nom of ASSETS_GARDES) {
  await copyFile(join(SOURCE, "assets", nom), join(CIBLE, "assets", nom));
}

// Données : structure conservée, valeurs intégralement régénérées.
const brut = JSON.parse(await readFile(join(SOURCE, "energie-data.json"), "utf8"));
const synthese = regenerer(brut);

/*
 * Le JSON repasse par le filtre textuel, et ce n'est pas une précaution
 * superflue : la première version l'écrivait directement, et les noms de
 * trajectoires — dont celui qui désigne le modèle — ont donc survécu dans le
 * fichier de données alors que tout le code était propre. Les libellés voyagent
 * dans les données autant que dans le code.
 */
const donnees = neutraliserTexte(JSON.stringify(synthese));
await writeFile(join(CIBLE, "energie-data.json"), donnees, "utf8");

const octets = donnees.length;
console.log(`✓ ${CIBLE}`);
console.log(`  données de synthèse : ${(brut.rows as unknown[]).length} séries, ${Math.round(octets / 1024)} Kio`);
console.log(`  assets conservés    : ${ASSETS_GARDES.length}`);
console.log(`  substitutions       : ${REMPLACEMENTS.length} motifs`);
