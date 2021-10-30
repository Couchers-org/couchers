module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!src/proto/**",
    "!src/stories/**",
    "!src/**/*.stories.tsx",
  ],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  testEnvironment: "jsdom",
  transformIgnorePatterns: ["/node_modules/"],
  resetMocks: true,
};
