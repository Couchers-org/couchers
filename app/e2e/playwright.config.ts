import { defineConfig, PlaywrightTestConfig } from "@playwright/test";

import { selectedDevices, selectedThemes } from "./config/devices";
import { resolveTarget } from "./config/targets";

const target = resolveTarget();

/**
 * The frontend is same-site with the backend on localdev, but not on `next`,
 * where the session cookie comes from next.couchershq.org while the page is on
 * localhost. That makes `couchers-sesh` third-party, which recent Chromium
 * blocks by default. Same problem the web readme documents for real browsers.
 */
const crossSiteCookieArgs = target.crossSiteCookies
  ? ["--disable-features=TrackingProtection3pcd,ThirdPartyStoragePartitioning"]
  : [];

const commonUse: PlaywrightTestConfig["use"] = {
  baseURL: target.baseUrl,
  locale: "en-US",
  timezoneId: "UTC",
  contextOptions: { reducedMotion: "reduce" },
  trace: "retain-on-failure",
  video: "off",
  screenshot: "off",
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
};

const matrixProjects = selectedDevices().flatMap((device) =>
  selectedThemes().map((theme) => ({
    name: `${device.name}-${theme}`,
    dependencies: ["setup"],
    use: {
      ...commonUse,
      ...device.use,
      colorScheme: theme,
      launchOptions: {
        ...((device.use.launchOptions as Record<string, unknown>) ?? {}),
        args: [
          ...(((device.use.launchOptions as { args?: string[] })?.args ?? []) as string[]),
          ...crossSiteCookieArgs,
        ],
      },
    },
    metadata: { device: device.name, theme },
  })),
);

export default defineConfig({
  testDir: ".",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: "./test-results",
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: commonUse },
    ...matrixProjects,
  ],
});
