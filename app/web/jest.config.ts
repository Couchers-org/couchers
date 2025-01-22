import type { Config } from "jest";
import nextJest from "next/jest";

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" });

const customJestConfig: Config = {
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
  //<rootDir> instead of . - https://github.com/tannerlinsley/react-query/issues/2339
  // @TODO(NA) ^^ Fixed in react-query v4, but we are still on v3. Remove this when we upgrade.
  moduleDirectories: ["node_modules", "<rootDir>"],
  reporters: ["default", "jest-junit"],
  setupFilesAfterEnv: ["./test/setupTests.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  testEnvironment: "jsdom",
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  resetMocks: true,
};

export default createJestConfig(customJestConfig);
