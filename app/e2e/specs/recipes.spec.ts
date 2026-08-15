import { test } from "@playwright/test";

import { ThemeName } from "../config/devices";
import { hasCapability, resolveTarget } from "../config/targets";
import { Nav } from "../pages/nav";
import { RECIPES } from "../recipes";
import { ANON_STORAGE_STATE, credentialsAvailable, PERSONAS, storageStatePath } from "../runner/personas";
import { createShot } from "../runner/shot";
import { installStability } from "../runner/stabilize";

const target = resolveTarget();

for (const persona of PERSONAS) {
  const recipes = RECIPES.filter((r) => r.as === persona);
  if (recipes.length === 0) continue;

  test.describe(persona, () => {
    test.use({
      storageState: persona === "anon" ? ANON_STORAGE_STATE : storageStatePath(persona, target),
    });

    test.skip(
      !credentialsAvailable(persona, target),
      `No credentials configured for "${persona}" on target "${target.id}"`,
    );

    for (const recipe of recipes) {
      test(recipe.id, async ({ page }, testInfo) => {
        const device = testInfo.project.metadata.device as string;
        const theme = testInfo.project.metadata.theme as ThemeName;

        test.skip(
          recipe.devices !== undefined && !recipe.devices.includes(device),
          `Recipe is limited to: ${recipe.devices?.join(", ")}`,
        );
        const missing = (recipe.needs ?? []).filter((c) => !hasCapability(target, c));
        test.skip(missing.length > 0, `Target "${target.id}" lacks: ${missing.join(", ")}`);

        await installStability(page);
        await page.addInitScript(() => localStorage.setItem("hasSeenCookieBanner", "true"));

        const written: string[] = [];
        const shot = createShot({ page, recipe, device, theme, target, written });

        await recipe.capture({ page, nav: new Nav(page), shot, target, device, theme });

        if (written.length === 0) {
          throw new Error(`Recipe "${recipe.id}" produced no screenshots`);
        }
        for (const file of written) {
          await testInfo.attach(file, { path: file, contentType: "image/png" });
        }
      });
    }
  });
}
