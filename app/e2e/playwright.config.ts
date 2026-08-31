import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const swiftshaderArgs = [
  "--enable-webgl",
  "--use-gl=swiftshader",
  "--enable-unsafe-swiftshader",
];

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "off",
    video: "on-first-retry",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  outputDir: "./test-results",
  projects: [
    {
      name: "iphone-15",
      use: {
        ...devices["iPhone 15"],
      },
    },
    {
      name: "android-small",
      use: {
        ...devices["Pixel 5"],
        launchOptions: { args: swiftshaderArgs },
      },
    },
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: swiftshaderArgs },
      },
    },
    {
      name: "desktop-firefox-4k",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 2560, height: 1440 },
      },
    },
  ],
});
