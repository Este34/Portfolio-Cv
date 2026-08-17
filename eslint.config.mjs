import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    /*
     * Démonstrations servies telles quelles.
     *
     * `public/demos/` contient la sortie du script de neutralisation : du code
     * écrit ailleurs, sous d'autres conventions, avec ses propres bibliothèques
     * vendorisées. Le linter y relevait 750 avertissements sur du code que ce
     * dépôt ne maintient pas et ne doit pas reformater — le réécrire pour
     * satisfaire des règles locales détruirait justement ce que la
     * démonstration prouve.
     */
    "public/demos/**",
  ]),
]);

export default eslintConfig;
