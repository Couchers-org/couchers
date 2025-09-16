/* eslint-disable @typescript-eslint/naming-convention */
import type { Config as JestConfig } from "jest";
import nextJest from "next/jest";
import { createDefaultPreset } from "ts-jest";
import z from "zod";

import { configUtils } from "./config";

const tsJestTransformCfg = createDefaultPreset().transform;

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" });

const envVarPrefix = "NEXT_PUBLIC_";

const utils = configUtils(envVarPrefix);

type RawConfig = z.infer<typeof utils.schema>;

// eslint-disable-next-line n/no-process-env
const envVars = process.env;

// TODO(FB) Consider moving to .env file
const defaultValues: {
  [K in keyof RawConfig]?: string;
} = {
  NODE_ENV: "development",
  NEXT_PUBLIC_COUCHERS_ENV: "dev",
  NEXT_PUBLIC_DISPLAY_VERSION: "",
  NEXT_PUBLIC_STRIPE_KEY: "fake-key",
  NEXT_PUBLIC_MEDIA_BASE_URL: "localhost",
  NEXT_PUBLIC_GLOBAL_MESSAGE_URL: "localhost",
  NEXT_PUBLIC_CONSOLE_BASE_URL: "localhost",
  NEXT_PUBLIC_NOMINATIM_URL: "localhost",
};

Object.entries(defaultValues).forEach(([key, value]) => {
  if (!envVars[key]) {
    envVars[key] = value;
  }
});

// eslint-disable-next-line n/no-process-env
const parsedEnv = utils.schema.parse(process.env);

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
    Config: utils.getStringReplacements(parsedEnv),
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
