import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import stylisticPlugin from "@stylistic/eslint-plugin";
import eslintParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import jestPlugin from "eslint-plugin-jest";
import nPlugin from "eslint-plugin-n";
import noRelativeImportPlugin from "eslint-plugin-no-relative-import-paths";
import reactPlugin from "eslint-plugin-react";
import unusedImportsPlugin from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";
import path from "path";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const boolPrefixes = ["is", "should", "has", "can", "did", "will", "does"];

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

export default defineConfig([
  {
    ignores: [
      "node_modules/**/*",
      ".yarn/**/*",
      ".vscode/**/*",
      ".devcontainer",
      "./backend",
      "./client",
      "./data",
      "./deployment",
      "./media",
      "./nginx",
      "./prometheus",
      "./proxy",
      "./proto",
      "./test-results",
      "web/proto/**",
      "web/.next/**",
      "web/public/service-worker.js",
      "web/next-env.d.ts",

      "./mobile",
      "./native",
    ],
  },
  // Next config needs compatibility layer for new ESLint versions
  compat.config({
    extends: ["next/core-web-vitals"],
    settings: {
      next: {
        rootDir: path.resolve(import.meta.dirname, "./web"),
      },
    },
  }),
  reactPlugin.configs.flat.recommended,
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parser: eslintParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: [
            path.resolve(import.meta.dirname, "./tsconfig.json"),
            path.resolve(import.meta.dirname, "./*/tsconfig.json"),
          ],
          noWarnOnMultipleProjects: true,
        },
      },
    },
    plugins: {
      "unused-imports": unusedImportsPlugin,
      import: importPlugin,
      "no-relative-import-paths": noRelativeImportPlugin,
      n: nPlugin,
      jest: jestPlugin,
      stylistic: stylisticPlugin,
      "@next": nextPlugin,
    },
    rules: {
      // Add a space after comments for consistency.
      // Stylistic rule that isn't handled by prettier
      "stylistic/spaced-comment": ["warn", "always"],

      // Console logs should only be used for debugging.
      // Use custom logging function for actual logging
      "no-console": "warn",

      "no-constant-condition": ["warn", { checkLoops: "allExceptWhileTrue" }],

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

      // Prevent accidental imports
      "no-restricted-imports": [
        "warn",
        {
          paths: [
            {
              name: "@/config",
              message:
                "Please don't import from @/config, it is only used for tooling",
            },
          ],
          patterns: [
            {
              group: ["@mui/system*"],
              message:
                "Please don't import from @mui/system, use @mui/material instead",
            },
            {
              group: ["console", "node:console"],
              message: "Please use @/log for logging",
            },
          ],
        },
      ],
      // Force absolute imports except from same folder
      "no-relative-import-paths/no-relative-import-paths": [
        "warn",
        {
          allowSameFolder: true,
          prefix: "@",
        },
      ],

      "object-shorthand": "warn",

      "no-useless-rename": "warn",

      "react/react-in-jsx-scope": "off",
      "react/hook-use-state": "warn",

      // Enforce arrow functions
      "no-restricted-syntax": [
        "warn",
        "FunctionExpression",
        "FunctionDeclaration",
      ],

      "prefer-arrow-callback": "warn",

      "@typescript-eslint/restrict-template-expressions": [
        "warn",
        {
          allowAny: false,
          allowBoolean: true,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],

      "@typescript-eslint/no-unnecessary-condition": [
        "warn",
        {
          allowConstantLoopConditions: "only-allowed-literals",
        },
      ],

      "n/no-process-env": "warn",

      // "@next/next/no-html-link-for-pages": [
      //   "error",
      //   path.resolve(import.meta.dirname, "./web/pages/"),
      // ],
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
        // Allow some styling property names
        {
          selector: "objectLiteralProperty",
          filter: {
            regex: "^&|^.Mui|^aria-|^Webkit|^\\$:",
            match: true,
          },
          format: null,
        },
        // Allow MUI styling for styled components
        {
          selector: "objectLiteralProperty",
          filter: {
            regex: "^.Mui",
            match: true,
          },
          format: null,
        },

        ...baseNamingConventions,
      ],
      "react/function-component-definition": [
        "warn",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
    },
  },
  {
    // Be a bit more lenient for tests
    files: ["**/*.test.{ts,tsx}", "**/*/test/**/*"],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "jest/no-test-prefixes": "warn",
      "jest/no-disabled-tests": "warn",
      "jest/consistent-test-it": ["warn", { fn: "it" }],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off",

      // TODO(FB) Enforce some naming conventions in tests
      "@typescript-eslint/naming-convention": ["off"],
    },
  },
  eslintConfigPrettier,
]);
