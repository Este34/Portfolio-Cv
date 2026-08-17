/**
 * Capture les simulateurs depuis leurs déploiements publics, neutralisés.
 *
 * ## Pourquoi neutraliser une page déjà publique
 *
 * Ces déploiements sont accessibles à qui connaît l'URL, mais les publier sur
 * ce portfolio est un acte différent : ça rattache nommément Esteban à son
 * employeur, ce que toute la démarche d'anonymisation cherche à éviter. Les
 * captures sont donc prises **après** avoir retiré du DOM les logos, le
 * bloc-marque de l'État, les noms de modèles et les territoires.
 *
 * La neutralisation opère sur la page vivante, avant le déclenchement de la
 * capture : ce qui est photographié est déjà propre, il n'y a pas d'image
 * intermédiaire à effacer.
 *
 * `recherche_comtrade` fait exception : ce dépôt est public sous le nom
 * d'Esteban, sa démonstration est déjà liée depuis le portfolio, et il est
 * présenté nommément. Il est capturé tel quel.
 *
 * Usage : node scripts/capturer-simulateurs.ts
 */

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Page } from "@playwright/test";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = join(RACINE, "public", "captures");

type Cible = {
  fichier: string;
  url: string;
  /** Sélecteur à cliquer pour dépasser une page de garde. */
  entrer?: string;
  /** Laisser les graphiques se dessiner avant la capture. */
  attendre?: number;
  neutraliser: boolean;
};

const CIBLES: Cible[] = [
  {
    fichier: "simulateur-energie",
    url: "https://simulateur-holistica.vercel.app",
    entrer: "#coverLaunch",
    attendre: 4000,
    neutraliser: true,
  },
  {
    fichier: "simulateur-mobilite",
    url: "https://simulateur-mobi.vercel.app",
    entrer: "#coverLaunch",
    attendre: 4000,
    neutraliser: true,
  },
  {
    fichier: "simulateur-agriculture",
    url: "https://holistica-agriculture.vercel.app",
    entrer: "#coverLaunch",
    attendre: 4000,
    neutraliser: true,
  },
  {
    fichier: "simulateur-numerique",
    url: "https://num-icare.vercel.app",
    entrer: "#coverLaunch",
    attendre: 4000,
    neutraliser: true,
  },
  {
    fichier: "plateforme",
    url: "https://site-cvi-vitrine.vercel.app",
    attendre: 3500,
    neutraliser: true,
  },
  {
    fichier: "comtrade",
    url: "https://recherchecomtrade.vercel.app",
    attendre: 4500,
    neutraliser: false,
  },
];

/**
 * Retire du document tout ce qui rattache la page à son commanditaire.
 *
 * Exécuté dans la page, avant la capture. Trois passes : les images et liens
 * identifiants sont supprimés, les nœuds de texte sont réécrits, et les mots
 * restants sont traqués pour être signalés à la sortie.
 */
async function neutraliserDom(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const SUBSTITUTIONS: [RegExp, string][] = [
      [/Num['’]Icare/gi, "Simulateur numérique"],
      [/\bHolistica\b/gi, "Simulateur"],
      [/\bOCC\s?MOBI\b/gi, "Simulateur mobilité"],
      [/\bZaka\b/gi, "Scénario figé"],
      [/\bIcare\b/gi, "cible"],
      [/CEA-?Isec/gi, "institut"],
      [/\bISEC\b/gi, "institut"],
      [/\bCEA\b/gi, "institut"],
      [/\bCVI\b/gi, "équipe"],
      [/\bMarcoule\b/gi, "site"],
      [/\bOccitanie\b/gi, "territoire régional"],
      [/France entière/gi, "Territoire national"],
      [/républi\w*\s*fran\w*/gi, ""],
      [/française/gi, "nationale"],
      [/français/gi, "national"],
      [/\bFrance\b/gi, "territoire"],
      [/\bINSEE\b/gi, "démographie de référence"],
      [/\bEPR2?\b/g, "nouvelles tranches"],
    ];

    // 1. Images, logos et liens sortants identifiants.
    for (const img of Array.from(document.images)) {
      const src = (img.getAttribute("src") ?? "") + (img.alt ?? "");
      if (/isec|cea|logo|marianne|carte_france|banniere/i.test(src)) img.remove();
    }
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href") ?? "";
      if (/gouv\.fr|cea\.fr|isec/i.test(href)) a.remove();
    }
    for (const el of Array.from(document.querySelectorAll(".fr-logo, [class*=logo]"))) {
      el.remove();
    }

    // 2. Réécriture des nœuds de texte.
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const noeuds: Text[] = [];
    while (parcours.nextNode()) noeuds.push(parcours.currentNode as Text);
    for (const n of noeuds) {
      let t = n.nodeValue ?? "";
      for (const [motif, par] of SUBSTITUTIONS) t = t.replace(motif, par);
      if (t !== n.nodeValue) n.nodeValue = t;
    }

    // 3. Attributs visibles (info-bulles, étiquettes d'accessibilité).
    for (const el of Array.from(document.querySelectorAll("[title], [aria-label], [alt]"))) {
      for (const attr of ["title", "aria-label", "alt"]) {
        const v = el.getAttribute(attr);
        if (!v) continue;
        let t = v;
        for (const [motif, par] of SUBSTITUTIONS) t = t.replace(motif, par);
        if (t !== v) el.setAttribute(attr, t);
      }
    }

    // 4. Contrôle : ce qui subsiste est signalé, pas masqué.
    const restes: string[] = [];
    const texte = document.body.innerText;
    for (const mot of ["Icare", "Holistica", "CEA", "ISEC", "CVI", "Occitanie", "Marcoule", "République"]) {
      if (new RegExp(`\\b${mot}\\b`, "i").test(texte)) restes.push(mot);
    }
    return restes;
  });
}

await mkdir(SORTIE, { recursive: true });
const navigateur = await chromium.launch();
let alertes = 0;

for (const cible of CIBLES) {
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // captures nettes sur écran à forte densité
  });
  const page = await contexte.newPage();

  try {
    await page.goto(cible.url, { waitUntil: "networkidle", timeout: 60_000 });

    if (cible.entrer) {
      const bouton = page.locator(cible.entrer);
      if (await bouton.count()) {
        await bouton.click();
        await page.waitForTimeout(1500);
      }
    }
    await page.waitForTimeout(cible.attendre ?? 2500);

    let restes: string[] = [];
    if (cible.neutraliser) {
      restes = await neutraliserDom(page);
      // Une seconde passe attrape ce que le rendu a réinjecté après coup.
      await page.waitForTimeout(600);
      restes = await neutraliserDom(page);
    }

    await page.screenshot({ path: join(SORTIE, `${cible.fichier}.png`) });

    const etat = restes.length ? `⚠ reste : ${restes.join(", ")}` : "propre";
    if (restes.length) alertes++;
    console.log(`${cible.fichier.padEnd(24)} ${etat}`);
  } catch (e) {
    console.log(`${cible.fichier.padEnd(24)} ✗ ${e instanceof Error ? e.message.slice(0, 80) : e}`);
    alertes++;
  }

  await contexte.close();
}

await navigateur.close();
console.log(
  alertes === 0
    ? `\n${CIBLES.length} captures dans public/captures/`
    : `\n${alertes} cible(s) à revoir avant publication.`,
);
