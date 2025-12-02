// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      // ~~~ settings for simple import sort plugin ~~~
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "import/order": "off",

      // ~~~ settings for unused imports plugin ~~~
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // ~~~ custom couchers settings ~~~
      // good in theory, but ts isn't perfect and library types can be wrong
      "@typescript-eslint/ban-ts-comment": "off",
      // better avoided but useful for gRPC
      "@typescript-eslint/no-non-null-assertion": "off",
      // used in testing
      "@typescript-eslint/no-empty-function": "off",
      // Prefer inferred types so that the code is as close to JS as possible
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
  {
    ignores: ["dist/*", "proto/*", "node_modules/*", "ios/*", "android/*"],
  },
]);
