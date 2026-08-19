import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Vitest ne prend que `tests/**` et seulement les fichiers `.test.ts`.
 *
 * Sans cette restriction, il ramasserait aussi `tests-visuels/*.spec.ts`, qui
 * sont des tests Playwright : ils importent `@playwright/test`, ne connaissent
 * pas l'environnement de Vitest, et échoueraient d'une manière parfaitement
 * incompréhensible pour qui lance simplement `npm test`.
 *
 * L'alias `@/` reprend celui de `tsconfig.json`. Sans lui, tout module de
 * `src/lib` qui importe du contenu par son chemin canonique devient
 * intestable, et le contourner par des chemins relatifs ferait dépendre la
 * forme du code de l'outil qui le vérifie, ce qui est le mauvais sens.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
