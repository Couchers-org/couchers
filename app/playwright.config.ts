import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

// @TODO(FB) Make configurable
const TEST_FRONTEND_URL = "http://localhost:3000";
const TEST_BACKEND_URL = "http://localhost:8888";

export default defineConfig({
  testDir: "./test/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: TEST_FRONTEND_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  ...(!process.env.CI
    ? {
        webServer: [
          // Frontend
          {
            command: "yarn workspace web start",
            url: TEST_FRONTEND_URL,
            env: {
              NODE_ENV: "test",
            },
          },
          // Backend
          {
            command: "docker compose up",
            url: TEST_BACKEND_URL,
            reuseExistingServer: true,
            env: {
              NODE_ENV: "test",
            },
          },
        ],
      }
    : {}),
});
