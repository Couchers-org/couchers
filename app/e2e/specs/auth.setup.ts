import fs from "fs";
import path from "path";

import { expect, test as setup } from "@playwright/test";

import { resolveTarget } from "../config/targets";
import { credentialsAvailable, credentialsFor, PERSONAS, storageStatePath } from "../runner/personas";

const target = resolveTarget();

/**
 * Logs each persona in once and saves the session, so the matrix doesn't
 * re-authenticate for every device/theme combination.
 */
for (const persona of PERSONAS.filter((p) => p !== "anon")) {
  setup(`log in as ${persona}`, async ({ page }) => {
    setup.skip(
      !credentialsAvailable(persona, target),
      `No credentials configured for "${persona}" on target "${target.id}"`,
    );

    const { username, password } = credentialsFor(persona, target);

    await page.goto("/login");
    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.getByRole("button", { name: "Log in" }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    // The banner is localStorage-backed, so dismissing it here keeps it out of
    // every screenshot this session produces.
    await page.evaluate(() => localStorage.setItem("hasSeenCookieBanner", "true"));

    const statePath = storageStatePath(persona, target);
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    await page.context().storageState({ path: statePath });

    expect(fs.existsSync(statePath)).toBe(true);
  });
}
