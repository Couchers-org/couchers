import fs from "fs";
import path from "path";

import { Page } from "@playwright/test";

import { ThemeName } from "../config/devices";
import { Target } from "../config/targets";
import { hideDevChrome } from "../pages/nav";
import { Recipe, ShotFn, ShotOptions } from "./recipe";
import { settle } from "./stabilize";

/**
 * WebGL map tiles never render identically twice, so they're blanked out
 * rather than compared. Recipes about the map itself can opt back in by
 * passing an empty mask.
 */
const MAP_CANVAS_SELECTOR = "canvas.maplibregl-canvas, canvas.mapboxgl-canvas";

const MASK_COLOUR = "#cccccc";

export function shotsDir(): string {
  return process.env.E2E_SHOTS_DIR || path.join(__dirname, "..", "screenshots");
}

export interface ShotSidecar {
  recipe: string;
  title: string;
  shot: string;
  device: string;
  theme: ThemeName;
  target: string;
  url: string;
  viewport: { width: number; height: number } | null;
}

interface CreateShotArgs {
  page: Page;
  recipe: Recipe;
  device: string;
  theme: ThemeName;
  target: Target;
  /** Records every file written, so the runner can report and diff them. */
  written: string[];
}

export function createShot({ page, recipe, device, theme, target, written }: CreateShotArgs): ShotFn {
  const dir = path.join(shotsDir(), `${device}-${theme}`, ...recipe.id.split("/"));

  return async function shot(name: string, options: ShotOptions = {}): Promise<void> {
    await hideDevChrome(page);
    await settle(page);
    fs.mkdirSync(dir, { recursive: true });

    const file = path.join(dir, `${name}.png`);
    const mask = options.mask ?? [page.locator(MAP_CANVAS_SELECTOR)];

    const subject = options.of ?? page;
    await subject.screenshot({
      path: file,
      mask,
      maskColor: MASK_COLOUR,
      ...(options.of ? {} : { fullPage: options.fullPage ?? false }),
      animations: "disabled",
    });

    const sidecar: ShotSidecar = {
      recipe: recipe.id,
      title: recipe.title,
      shot: name,
      device,
      theme,
      target: target.id,
      url: new URL(page.url()).pathname,
      viewport: page.viewportSize(),
    };
    fs.writeFileSync(file.replace(/\.png$/, ".json"), `${JSON.stringify(sidecar, null, 2)}\n`);

    written.push(file);
  };
}
