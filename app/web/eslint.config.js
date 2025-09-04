import { FlatCompat } from "@eslint/eslintrc";
import stylisticPlugin from "@stylistic/eslint-plugin";
import eslintParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import jestPlugin from "eslint-plugin-jest";
import noRelativeImportPlugin from "eslint-plugin-no-relative-import-paths";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import { dirname } from "path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const boolPrefixes = ["is", "should", "has", "can", "did", "will"];

const baseNamingConventions = [
  {
    // Allow prefixing unused variables with an underscore
    selector: "default",
    modifiers: ["unused"],
    format: ["strictCamelCase"],
    leadingUnderscore: "require",
  },
  {
    selector: "default",
    format: ["camelCase"],
  },
  {
    selector: "variable",
    modifiers: ["destructured"],
    format: null,
  },
  {
    selector: "variable",
    types: ["boolean"],
    format: ["PascalCase"],
    prefix: boolPrefixes,
  },
  {
    selector: "variable",
    modifiers: ["const", "global", "exported"],
    types: ["boolean"],
    format: ["UPPER_CASE"],
    prefix: boolPrefixes.map((prefix) => `${prefix.toUpperCase()}_`),
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  },
  {
    selector: "variable",
    modifiers: ["const", "global", "exported"],
    types: ["boolean", "number", "string"],
    format: ["UPPER_CASE"],
  },
  {
    selector: "variable",
    modifiers: ["const", "global"],
    format: ["UPPER_CASE", "camelCase"],
  },
  {
    selector: "variable",
    modifiers: ["const", "global"],
    format: ["camelCase"],
    types: ["function"],
  },
];

export default tseslint.config([
  {
    ignores: ["node_modules/**/*", ".yarn/**/*", "proto/**", ".next/**"],
  },
  // Next config needs compatibility layer for new ESLint versions
  compat.config({
    extends: ["next/core-web-vitals"],
    settings: {
      next: {
        rootDir: ".",
      },
    },
  }),
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parser: eslintParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: true,
        tsconfigRootDir: __dirname,
        projectService: true,
      },
    },
    plugins: {
      "unused-imports": unusedImportsPlugin,
      import: importPlugin,
      "no-relative-import-paths": noRelativeImportPlugin,
      jest: jestPlugin,
      stylistic: stylisticPlugin,
    },
    rules: {
      // Add a space after comments for consistency.
      // Stylistic rule that isn't handled by prettier
      "stylistic/spaced-comment": ["warn", "always"],

      // Console logs should only be used for debugging.
      // Use custom logging function for actual logging
      "no-console": "warn",

      "@typescript-eslint/no-empty-function": "warn",

      // Force promises to be awaited/handled with .catch,
      // can be bypassed by adding "void" in front of call
      "@typescript-eslint/no-floating-promises": ["warn", { ignoreVoid: true }],

      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      // Unused variables can be prefixed with an underscore to ignore
      // this warning. Use e.g. if you don't need the first parameter(s)
      // of a function
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      "import/no-useless-path-segments": "warn",

      "import/no-unresolved": "warn",

      // Force absolute imports except from same folder
      "no-relative-import-paths/no-relative-import-paths": [
        "warn",
        {
          allowSameFolder: true,
          prefix: "@",
        },
      ],

      "no-useless-rename": ["warn"],
    },
  },
  {
    // Naming conventions
    // Stylistic rule that isn't handled by prettier
    files: ["**/*.{ts,tsx}"],
    // Ignore this file, as there are a lot of weirdly named properties
    ignores: ["eslint.config.js"],
    rules: {
      camelcase: "off",
      "@typescript-eslint/naming-convention": [
        "warn",
        ...baseNamingConventions,
      ],
    },
  },
  // React-specific rules
  {
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "warn",
        // Allow pascal case for react components
        {
          selector: "function",
          format: ["PascalCase", "camelCase"],
        },
        // Allow pascal case for react components (arrow functions)
        {
          selector: "variable",
          modifiers: ["const", "global"],
          format: ["PascalCase", "camelCase"],
          types: ["function"],
        },
        // Allow pascal case for react component imports
        {
          selector: "import",
          format: ["PascalCase", "camelCase"],
        },
        // Allow "&" styling for styled components
        {
          selector: "objectLiteralProperty",
          filter: {
            regex: "^&",
            match: true,
          },
          format: null,
        },
        ...baseNamingConventions,
      ],
    },
  },
  {
    // Be a bit more lenient for tests
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "jest/no-test-prefixes": "warn",
      "jest/no-disabled-tests": "warn",
      "jest/consistent-test-it": ["warn", { fn: "it" }],
    },
  },
  eslintConfigPrettier,
]);
