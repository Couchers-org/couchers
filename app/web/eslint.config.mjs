import tsParser from "@typescript-eslint/parser";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import jsonc from "eslint-plugin-jsonc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "package-lock.json",
      "next-env.d.ts",
      "proto/**",
    ],
  },
  // eslint 9 flipped this default to "warn";
  {
    linterOptions: { reportUnusedDisableDirectives: "warn" },
  },

  // eslint-config-next 16 ships native flat config, so spread it directly
  // instead of going through FlatCompat. core-web-vitals = Next + React +
  // React Hooks rules; typescript = @typescript-eslint/recommended rules.
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // Scope to JS/TS so the import/* rules below resolve the `import` plugin
    // (registered by eslint-config-next only for these files, not for JSON).
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      // ~~~ settings for simple import sort plugin ~~~
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "sort-imports": "off",
      "import/order": "off",
      "import/first": "warn",
      "import/newline-after-import": "warn",
      "import/no-duplicates": "warn",

      // ~~~ setings for unused imports plugin ~~~
      "unused-imports/no-unused-imports": "warn",

      // ~~~ custom couchers settings ~~~
      //allow theme to be unused in makeStyles
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "theme",
          varsIgnorePattern: "classes|useStyles",
        },
      ],
      //good in theory, but ts isn't perfect and library types can be wrong
      "@typescript-eslint/ban-ts-comment": "off",
      //better avoided but useful for gRPC
      "@typescript-eslint/no-non-null-assertion": "off",
      //used in testing
      "@typescript-eslint/no-empty-function": "off",
      //not using this right now
      "@next/next/no-img-element": "off",

      "react/no-unescaped-entities": "off",
      // Prefer inferred types so that the code is as close to JS as possible
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // eslint-config-next 16 bundles eslint-plugin-react-hooks v6, whose
      // recommended set turns on the React Compiler lint rules. We don't use
      // the React Compiler, and these flag long-standing patterns that weren't
      // enforced before this upgrade. Keep rules-of-hooks/exhaustive-deps on
      // and defer adopting the rest as separate work.
      // @TODO(NA): Revisit these rules and address code issues in separate PR
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: { parser: tsParser },
  },
  // the jsonc preset is pinned to **/*.json: unpinned it would also grab
  // .json5/.jsonc, and without files globs `eslint .` wouldn't lint json at all
  ...jsonc.configs["flat/recommended-with-json"].map((config) => ({
    ...config,
    files: ["**/*.json"],
  })),
  {
    files: ["**/*.json"],
    rules: { "jsonc/no-comments": "off" },
  },
];

export default config;
