import { devices as playwrightDevices } from "@playwright/test";

/**
 * The screenshot matrix. Every recipe runs on each of these crossed with each
 * theme, unless it narrows the list itself.
 *
 * The defaults are all Chromium: MapLibre needs WebGL, which headless browsers
 * only render with SwiftShader, and the flags for that are Chromium-only.
 * `mobile-safari` and `desktop-firefox` exist for checking engine-specific
 * layout, but maps come out blank there, so they're opt-in.
 */

export type ThemeName = "light" | "dark";
export const THEMES: ThemeName[] = ["light", "dark"];

// Software GL, so MapLibre's canvas actually renders headless.
const SWIFTSHADER_ARGS = ["--enable-webgl", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"];

export interface DeviceDef {
  name: string;
  isDefault: boolean;
  use: Record<string, unknown>;
}

export const DEVICES: DeviceDef[] = [
  {
    name: "desktop",
    isDefault: true,
    use: {
      ...playwrightDevices["Desktop Chrome"],
      viewport: { width: 1440, height: 900 },
      launchOptions: { args: SWIFTSHADER_ARGS },
    },
  },
  {
    name: "mobile",
    isDefault: true,
    use: {
      ...playwrightDevices["Pixel 5"],
      launchOptions: { args: SWIFTSHADER_ARGS },
    },
  },
  {
    name: "tablet",
    isDefault: false,
    use: {
      ...playwrightDevices["Galaxy Tab S4 landscape"],
      launchOptions: { args: SWIFTSHADER_ARGS },
    },
  },
  {
    name: "mobile-safari",
    isDefault: false,
    use: { ...playwrightDevices["iPhone 15"] },
  },
  {
    name: "desktop-firefox",
    isDefault: false,
    use: { ...playwrightDevices["Desktop Firefox"], viewport: { width: 1440, height: 900 } },
  },
];

export function selectedDevices(): DeviceDef[] {
  const requested = process.env.E2E_DEVICES;
  if (!requested) return DEVICES.filter((d) => d.isDefault);
  const names = requested.split(",").map((n) => n.trim());
  return names.map((name) => {
    const device = DEVICES.find((d) => d.name === name);
    if (!device) {
      throw new Error(`Unknown device "${name}". Known: ${DEVICES.map((d) => d.name).join(", ")}`);
    }
    return device;
  });
}

export function selectedThemes(): ThemeName[] {
  const requested = process.env.E2E_THEMES;
  if (!requested) return THEMES;
  return requested.split(",").map((t) => {
    const theme = t.trim();
    if (theme !== "light" && theme !== "dark") throw new Error(`Unknown theme "${theme}"`);
    return theme;
  });
}
