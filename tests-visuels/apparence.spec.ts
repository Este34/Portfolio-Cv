import { expect, test, type Page } from "@playwright/test";

/**
 * Régression visuelle, page par page, dans les deux langues et les deux thèmes.
 *
 * La direction artistique de ce site a été refaite une fois de fond en comble,
 * parce que la première version avait été dessinée sans que personne ne la
 * regarde. Ces tests existent pour que ça n'arrive plus : toute modification
 * qui déplace un pixel se voit dans une revue, avant d'être en ligne.
 */

/**
 * Les pages, et la langue dans laquelle chacune est photographiée.
 *
 * ## Pourquoi toutes ne sont pas dans les deux langues
 *
 * Les images de référence sont versionnées, et une page longue en pèse jusqu'à
 * un méga-octet. La matrice complète — neuf pages × deux langues × deux
 * appareils — donnait 18 Mo, réécrits en entier à chaque rafraîchissement.
 * C'est un coût permanent dans l'historique du dépôt pour un gain qui décroît
 * vite : les deux langues partagent leurs gabarits, seul le texte change.
 *
 * L'anglais est donc photographié là où sa longueur peut casser quelque chose :
 * les pages à gros titres et à colonnes serrées. Ailleurs, le français suffit à
 * détecter une régression de mise en page, et le test de contenu garantit déjà
 * qu'aucune traduction n'est vide.
 */
const PAGES = [
  { nom: "accueil", chemin: "/", langues: ["fr", "en"] },
  { nom: "travaux", chemin: "/travaux", langues: ["fr", "en"] },
  { nom: "etude-de-cas", chemin: "/travaux/pipeline-comtrade", langues: ["fr", "en"] },
  { nom: "parcours", chemin: "/parcours", langues: ["fr"] },
  { nom: "methode", chemin: "/methode", langues: ["fr"] },
  { nom: "making-of", chemin: "/making-of", langues: ["fr"] },
  { nom: "evaluations", chemin: "/evaluations", langues: ["fr"] },
  { nom: "contact", chemin: "/contact", langues: ["fr"] },
  { nom: "bac-a-sable", chemin: "/bac-a-sable", langues: ["fr"] },
  { nom: "labo", chemin: "/labo", langues: ["fr"] },
  { nom: "notes", chemin: "/notes", langues: ["fr"] },
  { nom: "note", chemin: "/notes/un-champ-vide-ne-vaut-pas-zero", langues: ["fr", "en"] },
] as const;

/**
 * Sur mobile, seules les pages dont la mise en page change vraiment.
 *
 * Les autres se replient toutes sur la même colonne unique : les photographier
 * reviendrait à vérifier neuf fois la même chose, pour neuf images de plus.
 */
const PAGES_MOBILE = new Set(["accueil", "travaux", "etude-de-cas", "labo"]);

/**
 * Charge une page et attend qu'elle soit photographiable.
 *
 * ## Le rechargement n'est pas superflu
 *
 * Au tout premier affichage, l'optimiseur d'images de Next produit les
 * variantes du portrait et des captures de simulateurs à la volée. La mise en
 * page se pose donc légèrement différemment de tous les affichages suivants, où
 * les images sortent du cache. L'écart se compte en un pixel de hauteur totale,
 * et un pixel suffit à faire échouer une comparaison d'images. On recharge donc
 * une fois : la capture porte toujours sur le second affichage, jamais sur le
 * premier.
 *
 * ## Ce qui a été essayé avant
 *
 * Fixer soi-même la fenêtre à la hauteur du document, pour éviter que
 * Playwright ne la redimensionne. Mauvaise idée : la page de contact réserve
 * `70vh`, si bien que réduire la fenêtre à la hauteur du contenu réduit le
 * contenu, ce qui réduit la fenêtre. La page rétrécissait de 1392 px à 1050 px
 * en quatre tours de boucle.
 */
async function ouvrir(page: Page, chemin: string) {
  await page.goto(chemin);
  await page.waitForLoadState("networkidle");
  await page.reload();
  await page.waitForLoadState("networkidle");

  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images)
        .filter((i) => !i.complete)
        .map((i) => i.decode().catch(() => undefined)),
    ),
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

/**
 * Options de capture.
 *
 * ## Ce qui est masqué, et pourquoi si peu
 *
 * La première version masquait **tous** les canvas. C'était une erreur, et elle
 * se voyait sur la première référence produite : le fond en shader couvre tout
 * le bandeau d'accueil en `absolute inset-0`, si bien que le masque effaçait le
 * titre, l'accroche, les boutons et le portrait. La partie la plus importante
 * du site n'était plus vérifiée du tout.
 *
 * Sont masquées les figures dont le contenu n'est pas reproductible :
 *
 *  - **nuée, k-moyennes, agar** — leur état initial est tiré au hasard, les
 *    comparer ne testerait qu'un générateur de nombres ;
 *  - **le réseau** — depuis qu'il tire sa forme au sort à chaque visite, il
 *    entre dans la même catégorie. C'était sa seule différence avec les
 *    autres, et elle a disparu le jour où la démonstration a cessé de montrer
 *    toujours les mêmes spirales ;
 *  - **la politique apprise** — sa graine est tirée à chaque visite, comme
 *    celle du réseau, et l'agent montré à l'écran joue un monde tiré au sort ;
 *  - **la projection du corpus** — elle passe désormais par Three.js dès
 *    l'hydratation, et un rendu WebGL en trois dimensions dépend du pilote
 *    graphique bien plus qu'un canvas en deux dimensions.
 *
 * Le cadre de chacune reste vérifié : s'il disparaît ou change de taille, le
 * masque bouge et la comparaison échoue.
 *
 * Le fond en shader n'est **pas** masqué. Il est reproductible par
 * construction : image unique à temps fixe en mouvement réduit, et bruit à
 * hachage entier identique d'un pilote à l'autre. Deux exécutions consécutives
 * ont confirmé la stabilité avant de retenir ce choix.
 */
function options(page: Page) {
  return {
    fullPage: true,
    mask: [
      page.locator(
        "#nuee canvas, #k-moyennes canvas, #agar canvas, #reseau canvas, #politique canvas, #corpus canvas",
      ),
    ],
    maskColor: "#ff00ff",
  };
}

for (const { nom, chemin, langues } of PAGES) {
  for (const langue of langues) {
    test(`${langue} — ${nom}`, async ({ page }, infos) => {
      test.skip(
        infos.project.name === "mobile" && !PAGES_MOBILE.has(nom),
        "mise en page identique aux autres pages en colonne unique",
      );
      await ouvrir(page, `/${langue}${chemin === "/" ? "" : chemin}`);
      await expect(page).toHaveScreenshot(`${langue}-${nom}.png`, options(page));
    });
  }
}

/**
 * Le thème clair n'est testé que sur l'accueil, et seulement sur bureau.
 *
 * Il partage ses gabarits avec le sombre : seuls les jetons de couleur
 * changent. Une page suffit à attraper un jeton cassé — c'est d'ailleurs
 * exactement ce que ce test a servi à voir, quand le fond en shader s'est
 * révélé deux fois trop dense sur fond crème.
 */
test.describe("thème clair", () => {
  test.use({ colorScheme: "light" });

  test("accueil", async ({ page }, infos) => {
    test.skip(infos.project.name === "mobile", "un seul appareil suffit pour les jetons");
    await ouvrir(page, "/fr");
    await expect(page).toHaveScreenshot("clair-accueil.png", options(page));
  });
});

/**
 * La console est un panneau modal : elle n'apparaît sur aucune capture de page,
 * et c'est pourtant l'élément le plus dense du site.
 */
test("console ouverte", async ({ page }, infos) => {
  test.skip(infos.project.name === "mobile", "le panneau occupe alors tout l'écran");
  await ouvrir(page, "/fr");
  await page.getByRole("button", { name: "Console" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveScreenshot("console.png", options(page));
});

/**
 * L'en-tête ne doit jamais passer à la ligne.
 *
 * Assertion fonctionnelle, pas une image : c'est la comparaison des références
 * Windows et Linux qui a révélé le défaut, mais s'en remettre à l'œil pour le
 * détecter à nouveau serait fragile. Les polices Linux étant un peu plus
 * larges, « Bac à sable » et « Ctrl K » se coupaient en deux et la barre
 * dépassait sa hauteur.
 *
 * Deux vérifications complémentaires. La hauteur d'abord : `h-14` vaut 56 px,
 * et tout dépassement signale un retour à la ligne. La largeur de chaque entrée
 * ensuite : une entrée coupée est plus haute que sa ligne de texte, ce qui se
 * mesure sans dépendre de la police.
 */
/** Largeur à partir de laquelle la navigation complète s'affiche (`xl`). */
const SEUIL_NAVIGATION = 1280;

for (const largeur of [1120, 1280, 1440, 1600]) {
  test(`en-tête sur une seule ligne à ${largeur} px`, async ({ page }, infos) => {
    test.skip(infos.project.name === "mobile", "la navigation complète y est masquée");
    await page.setViewportSize({ width: largeur, height: 900 });

    for (const langue of ["fr", "en"] as const) {
      await ouvrir(page, `/${langue}`);

      const hauteur = await page
        .locator("header > div")
        .first()
        .evaluate((e) => e.getBoundingClientRect().height);
      expect(hauteur, `${langue} : l'en-tête déborde de sa hauteur`).toBeLessThanOrEqual(56);

      const liens = page.locator("header nav a");
      const nombre = await liens.count();

      /*
       * En dessous du seuil, la navigation est volontairement absente : la
       * console la contient. L'affirmer plutôt que de sauter le cas, sinon un
       * jour où elle disparaîtrait par accident à 1600 px, personne ne le
       * saurait.
       */
      if (largeur < SEUIL_NAVIGATION) {
        expect(await liens.first().isVisible().catch(() => false)).toBe(false);
        continue;
      }

      expect(nombre, `${langue} : la navigation est absente`).toBeGreaterThan(0);

      for (let i = 0; i < nombre; i++) {
        const boite = await liens.nth(i).boundingBox();
        const texte = await liens.nth(i).innerText();
        // Une entrée sur deux lignes fait plus de 40 px de haut ; sur une, ~36.
        expect(boite?.height ?? 0, `${langue} : « ${texte} » est coupé`).toBeLessThan(40);
      }
    }
  });
}

/**
 * Aucun titre collant ne doit en recouvrir un autre.
 *
 * Plusieurs pages posent leur titre de section en `sticky` dans la colonne de
 * gauche. La zone dans laquelle un élément collant reste coincé est le bloc de
 * son **parent** : tant que ce parent était la grille entière, les quatre
 * titres se collaient à la même hauteur et s'empilaient les uns sur les autres.
 *
 * Ce défaut n'existe qu'entre deux positions de défilement. Il n'apparaît sur
 * aucune capture de page prise en haut, il ne lève aucune erreur, et il ne se
 * lit pas dans le code — la contrainte de confinement n'y est écrite nulle
 * part. D'où ce test, qui descend dans la page et mesure.
 */
const PAGES_A_TITRES_COLLANTS = [
  "/fr/methode",
  "/fr/making-of",
  "/fr/parcours",
  "/fr/travaux/pipeline-comtrade",
];

for (const chemin of PAGES_A_TITRES_COLLANTS) {
  test(`titres collants disjoints sur ${chemin}`, async ({ page }, infos) => {
    test.skip(infos.project.name === "mobile", "la colonne collante n'existe qu'à partir de lg");

    await page.goto(chemin);
    await page.waitForLoadState("networkidle");

    /* Trois positions : le défaut n'apparaît qu'une fois la première rangée dépassée. */
    for (const y of [800, 1400, 2200]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(150);

      const chevauchements = await page.evaluate(() => {
        const boites = [...document.querySelectorAll("main h2")].map((h) => {
          const r = h.getBoundingClientRect();
          return { r, texte: h.textContent?.trim().slice(0, 40) ?? "" };
        });
        const paires: string[] = [];
        for (let i = 0; i < boites.length; i++) {
          for (let j = i + 1; j < boites.length; j++) {
            const a = boites[i].r;
            const b = boites[j].r;
            const seCroisent =
              a.bottom > b.top && b.bottom > a.top && a.right > b.left && b.right > a.left;
            if (seCroisent) paires.push(`« ${boites[i].texte} » et « ${boites[j].texte} »`);
          }
        }
        return paires;
      });

      expect(chevauchements, `à ${y} px de défilement`).toEqual([]);
    }
  });
}

/**
 * Les quatre motifs de fond doivent avoir un poids d'encre comparable.
 *
 * Ce test existe à cause d'un défaut réel : le motif « flux » éteint les zones
 * où le champ est plat, et ses deux bornes étaient calibrées sur des valeurs de
 * gradient qui ne se produisent jamais. Résultat, il couvrait 0,7 % de l'écran
 * contre 14 à 16 % pour les trois autres, et il était tout simplement invisible
 * sur la page des travaux.
 *
 * Rien ne l'a signalé. Le shader compilait, la page se rendait, les captures de
 * référence étaient stables — sur un fond qui n'existait pas. Seule une mesure
 * pouvait le voir.
 *
 * La méthode : masquer tout sauf le conteneur du fond, qui porte `aria-hidden`,
 * puis compter les pixels qui s'écartent du fond de page. C'est ce que l'œil
 * voit une fois tout composé, et non ce que le shader croit produire.
 */
const MOTIFS_ATTENDUS = [
  { motif: "niveaux", chemin: "/fr" },
  { motif: "trame", chemin: "/fr/methode" },
  { motif: "interference", chemin: "/fr/labo" },
  { motif: "flux", chemin: "/fr/travaux" },
] as const;

for (const { motif, chemin } of MOTIFS_ATTENDUS) {
  test(`le fond « ${motif} » a le poids attendu`, async ({ page }, infos) => {
    test.skip(infos.project.name === "mobile", "une seule densité de pixels suffit à mesurer");

    await page.goto(chemin);
    await page.waitForLoadState("networkidle");
    await page.addStyleTag({
      content: `body > * { visibility: hidden !important }
                [aria-hidden="true"], [aria-hidden="true"] * { visibility: visible !important }`,
    });
    await page.waitForTimeout(600);

    const cliche = (
      await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 620 } })
    ).toString("base64");

    const couverture = await page.evaluate(async (b64) => {
      const image = await createImageBitmap(
        await (await fetch(`data:image/png;base64,${b64}`)).blob(),
      );
      const toile = document.createElement("canvas");
      toile.width = image.width;
      toile.height = image.height;
      const ctx = toile.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, toile.width, toile.height).data;
      const fond = (getComputedStyle(document.body).backgroundColor.match(/\d+/g) ?? []).map(Number);

      let couverts = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const ecart =
          (Math.abs(pixels[i] - fond[0]) +
            Math.abs(pixels[i + 1] - fond[1]) +
            Math.abs(pixels[i + 2] - fond[2])) /
          3;
        if (ecart > 6) couverts++;
      }
      return (couverts / (pixels.length / 4)) * 100;
    }, cliche);

    /*
     * Bande large à dessein. Ce test ne défend pas un réglage esthétique — il
     * attrape le motif qui a disparu ou celui qui a doublé, c'est-à-dire l'ordre
     * de grandeur, pas le pour cent près.
     */
    expect(couverture, `${motif} : couverture de ${couverture.toFixed(1)} %`).toBeGreaterThan(8);
    expect(couverture, `${motif} : couverture de ${couverture.toFixed(1)} %`).toBeLessThan(26);
  });
}
