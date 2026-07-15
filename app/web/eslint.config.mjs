import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier/flat";
import jsonc from "eslint-plugin-jsonc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

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
    linterOptions: { reportUnusedDisableDirectives: "on" },
  },


  // both legacy extends must go through the same FlatCompat instance so the
  // @typescript-eslint plugin resolves to one module object ("Cannot redefine
  // plugin" otherwise)

  // Come back to this after we upgrade next.js https://github.com/Couchers-org/couchers/issues/9280
  ...compat.extends(
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals",
  ),
  prettier,
  {
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
