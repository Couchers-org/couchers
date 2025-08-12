// import reactRefresh from "eslint-plugin-react-refresh";
import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import eslintParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
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

export default tseslint.config([
  {
    ignores: ["node_modules/**/*", ".yarn/**/*", "proto/**", ".next/**"],
  },
  compat.config({
    extends: ["next"],
    settings: {
      next: {
        rootDir: ".",
      },
    },
  }),
  eslint.configs.recommended,
  tseslint.configs.strict,
  {
    languageOptions: {
      parser: eslintParser,
      parserOptions: {
        ecmaVersion: 2021,
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
    },
    rules: {
      "prefer-const": [
        "warn",
        {
          ignoreReadBeforeAssign: true,
        },
      ],
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: true },
      ],
      "spaced-comment": [
        "warn",
        "always",
        {
          markers: ["/"],
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
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
      "no-relative-import-paths/no-relative-import-paths": [
        "warn",
        {
          allowSameFolder: true,
        },
      ],
    },
  },
  {
    // be a bit more lenient for tests
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
]);
