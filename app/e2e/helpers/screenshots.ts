import { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS_BASE = path.join(__dirname, "..", "screenshots");

let currentDevice = "default";

/** Set the device/project name for screenshot subdirectory */
export function setDeviceName(name: string) {
  currentDevice = name;
}

/**
 * Take a viewport-only screenshot.
 * Saved to screenshots/<device-name>/<name>.png
 */
export async function takeScreenshot(page: Page, name: string) {
  const dir = path.join(SCREENSHOTS_BASE, currentDevice);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `${name}.png`);
  // fullPage: false → captures only what fits in the viewport
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  [${currentDevice}] ${name}.png`);
}
