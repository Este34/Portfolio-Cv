import { defineConfig } from "vitest/config";

/**
 * Vitest ne prend que `tests/**` et seulement les fichiers `.test.ts`.
 *
 * Sans cette restriction, il ramasserait aussi `tests-visuels/*.spec.ts`, qui
 * sont des tests Playwright : ils importent `@playwright/test`, ne connaissent
 * pas l'environnement de Vitest, et échoueraient d'une manière parfaitement
 * incompréhensible pour qui lance simplement `npm test`.
 */
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
