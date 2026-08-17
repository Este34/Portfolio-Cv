import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de régression visuelle.
 *
 * ## Ce qu'ils vérifient, et ce qu'ils ne vérifient pas
 *
 * Ils comparent le rendu de chaque page à une image de référence versionnée.
 * C'est le seul filet qui attrape ce qu'aucun test unitaire ne voit : une règle
 * Tailwind supprimée qui vide une classe, un jeton de couleur renommé, un titre
 * qui déborde, une grille qui s'effondre à une largeur donnée. Ces défauts ne
 * lèvent aucune erreur — ils se voient, ou ils ne se voient pas.
 *
 * Les canvas sont masqués. Un shader et quatre simulations produisent des
 * pixels différents à chaque image ; les comparer reviendrait à tester un
 * générateur pseudo-aléatoire. Ce qui est vérifié, c'est que le cadre est là,
 * à la bonne taille, au bon endroit.
 *
 * ## Les références dépendent de la plateforme
 *
 * Le rendu du texte n'est pas identique sous Windows et sous Linux : même
 * police, même taille, autre moteur de rastérisation. Playwright suffixe donc
 * les images par plateforme, et il en faut un jeu par système où la suite
 * tourne. Abaisser le seuil de tolérance jusqu'à absorber cet écart le rendrait
 * assez large pour laisser passer les régressions qu'on cherche.
 *
 * Pour créer ou rafraîchir un jeu :
 *   npm run test:visuel -- --update-snapshots
 *
 * Sur Linux, le même geste passe par l'action « Références visuelles » du
 * dépôt, qui tourne dans le conteneur officiel et publie les images.
 */
export default defineConfig({
  testDir: "./tests-visuels",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  expect: {
    toHaveScreenshot: {
      /*
       * Deux seuils, et ils font deux choses différentes. `threshold` est la
       * tolérance par pixel — l'anticrénelage fait varier un pixel de bord de
       * quelques valeurs sans que rien n'ait changé. `maxDiffPixelRatio` est la
       * part de l'image autorisée à différer : 0,2 % de 1440 × 900, c'est
       * environ 2600 pixels, assez pour absorber du bruit de rendu et très
       * en dessous de ce que déplace le moindre changement de mise en page.
       */
      threshold: 0.2,
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
      caret: "hide",
    },
  },

  use: {
    baseURL: process.env.URL_TEST ?? "http://localhost:3111",
    trace: "retain-on-failure",
  },

  /*
   * Mouvement réduit demandé au navigateur, sur les deux projets.
   *
   * Ce n'est pas qu'un réglage de confort : le fond en shader et le harnais des
   * simulations respectent `prefers-reduced-motion` en calculant une seule
   * image puis en arrêtant leur boucle. La page devient donc figée, et donc
   * comparable. Sans ça, chaque capture tomberait sur une image différente.
   *
   * L'option se déclare par projet et non dans `use` global : la définition de
   * type de Playwright la place au niveau du contexte de navigateur.
   */
  projects: [
    {
      name: "bureau",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        /*
         * Densité ramenée à 1, contre 2,625 pour l'appareil réel.
         *
         * Les images de référence sont versionnées, et une page longue capturée
         * en entier à 2,625× pèse plusieurs méga-octets — le jeu complet
         * dépassait 17 Mo, réécrits intégralement à chaque rafraîchissement.
         * Une régression de mise en page se voit exactement aussi bien à
         * densité 1 : ce qu'on compare, ce sont des positions et des couleurs,
         * pas la finesse du rendu.
         */
        deviceScaleFactor: 1,
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],

  /*
   * Le serveur est construit puis démarré par Playwright lui-même. Comparer un
   * rendu de développement n'aurait pas de sens : il n'a ni le même découpage
   * de code, ni les mêmes images optimisées, ni la même hydratation.
   */
  webServer: {
    command: "npm run build && npx next start -p 3111",
    url: "http://localhost:3111/fr",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
