import { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots");

/** Ensure the screenshots directory exists */
function ensureDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

/**
 * Take a named screenshot. Files are saved to /app/e2e/screenshots/.
 * The name should be descriptive, e.g. "01-signup-basic-form".
 */
export async function takeScreenshot(page: Page, name: string) {
  ensureDir();
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Screenshot saved: ${name}.png`);
}
