import { Config } from "jest";
import { createDefaultEsmPreset, createDefaultPreset } from "ts-jest";
import z from "zod";

import { configUtils } from "./config.ts";

const tsJestTransformCfg = createDefaultPreset().transform;

// Providing the path to your Next.js app which will enable loading next.config.js and .env files

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
  NEXT_PUBLIC_CDN_BASE_URL: "https://cdn.couchers.org",
};

Object.entries(defaultValues).forEach(([key, value]) => {
  if (!envVars[key]) {
    envVars[key] = value;
  }
});

// eslint-disable-next-line n/no-process-env
const parsedEnv = utils.schema.parse(process.env);

const config: Config = {
  ...createDefaultEsmPreset({ useESM: true }),
  verbose: true,
  testEnvironment: "jsdom",
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
  // moduleNameMapper: {
  //   // Mock CSS/SCSS files
  //   "\\.(css|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
  //   // Mock static assets (images, fonts)
  //   "\\.(jpg|jpeg|png|svg|gif|woff2?|eot|ttf)$":
  //     "<rootDir>/__mocks__/fileMock.js",
  //   // Handle path aliases
  //   "^@/(.*)$": "<rootDir>/$1",
  // },
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
    "^@/(.*)$": "<rootDir>/$1",

    // Handle next/font
    "next/font/(.*)": `<rootDir>/__mocks__/nextFontMock.js`,
    // Disable server-only
    "server-only": `<rootDir>/__mocks__/empty.js`,
  },
  reporters: ["default", "jest-junit"],
  setupFilesAfterEnv: ["./test/setupTests.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  resetMocks: true,
  // transform: {
  //   "^.+\\.tsx?$": "ts-jest",
  // },
  // transform: tsJestTransformCfg,
};

export default config;
