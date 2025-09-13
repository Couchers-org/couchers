/* eslint-disable @typescript-eslint/naming-convention */
import { Value } from "@sinclair/typebox/value";
import type { Config as JestConfig } from "jest";
import nextJest from "next/jest";
import { createDefaultPreset } from "ts-jest";

import { configUtils } from "./config";

const tsJestTransformCfg = createDefaultPreset().transform;

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" });

const envVarPrefix = "NEXT_PUBLIC_";

const utils = configUtils(envVarPrefix);

// eslint-disable-next-line n/no-process-env
const parsedEnv = Value.Parse(utils.schema, process.env);

const config = {};
Object.assign(config, utils.getStringReplacements(parsedEnv));

const customJestConfig: JestConfig = {
  verbose: true, // Shows detailed test results
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!jest.config.ts",
    "!proto/**",
    "!.next/**",
    "!**/*.coverage/**",
  ],
  globals: {
    Config: config,
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],

  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    // https://jestjs.io/docs/webpack#mocking-css-modules
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

    // Handle image imports
    // https://jestjs.io/docs/webpack#handling-static-assets
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$": `<rootDir>/__mocks__/fileMock.js`,

    // Handle module aliases
    "^@/components/(.*)$": "<rootDir>/components/$1",

    // Handle next/font
    "next/font/(.*)": `<rootDir>/__mocks__/nextFontMock.js`,
    // Disable server-only
    "server-only": `<rootDir>/__mocks__/empty.js`,
  },
  // <rootDir> instead of . - https://github.com/tannerlinsley/react-query/issues/2339
  // @TODO(NA) ^^ Fixed in react-query v4, but we are still on v3. Remove this when we upgrade.
  moduleDirectories: ["node_modules", "<rootDir>"],
  transform: tsJestTransformCfg,
  reporters: ["default", "jest-junit"],
  setupFilesAfterEnv: ["./test/setupTests.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  testEnvironment: "jsdom",
  resetMocks: true,
};

export default createJestConfig(customJestConfig);
