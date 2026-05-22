// Jest global setup for mobile app tests

// Use fake timers by default for consistent async behavior
jest.useFakeTimers();

// Common environment variables
process.env.EXPO_PUBLIC_WEB_BASE_URL = "https://couchers.org";

// Mock AsyncStorage with the library-provided in-memory implementation
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock expo-constants globally
jest.mock("expo-constants", () => ({
  expoConfig: {
    version: "1.0.0-test",
    extra: {
      eas: { projectId: "test-project-id" },
      gitHash: "abc12345",
    },
  },
  nativeBuildVersion: "42",
}));

// Mock react-i18next globally - returns translation key for easy assertions
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: "3rdParty", init: jest.fn() },
}));

// Mock @/i18n module
jest.mock("@/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Suppress expected console output during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation();
  jest.spyOn(console, "warn").mockImplementation();
  jest.spyOn(console, "debug").mockImplementation();
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Clear mocks between tests for isolation
beforeEach(() => {
  jest.clearAllMocks();
});
