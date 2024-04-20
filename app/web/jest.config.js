const nextJest = require("next/jest");

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!proto/**",
    "!stories/**",
    "!.next/**",
    "!**/*.stories.tsx",
  ],
  //<rootDir> instead of . - https://github.com/tannerlinsley/react-query/issues/2339
  moduleDirectories: ["node_modules", "<rootDir>"],
  setupFilesAfterEnv: ["./test/setupTests.ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  testEnvironment: "jsdom",
  resetMocks: true,
};

module.exports = createJestConfig(customJestConfig);
