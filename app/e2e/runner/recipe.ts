import { Locator, Page } from "@playwright/test";

import { Capability, Target } from "../config/targets";
import { ThemeName } from "../config/devices";
import { PersonaName } from "./personas";
import { Nav } from "../pages/nav";

export interface ShotOptions {
  /** Extra regions to blank out. Map canvases are always masked. */
  mask?: Locator[];
  fullPage?: boolean;
  /** Capture just this element rather than the viewport. */
  of?: Locator;
}

export type ShotFn = (name: string, options?: ShotOptions) => Promise<void>;

export interface RecipeContext {
  page: Page;
  nav: Nav;
  shot: ShotFn;
  target: Target;
  device: string;
  theme: ThemeName;
}

export interface Recipe {
  /** Stable path-like identifier, e.g. "profile/edit". Doubles as the output directory. */
  id: string;
  /** Human-readable name, shown in contact sheets and pushed to Weblate. */
  title: string;
  as: PersonaName;
  /** Restrict to specific devices. Defaults to the whole selected matrix. */
  devices?: string[];
  /** Target capabilities without which this recipe is skipped. */
  needs?: Capability[];
  capture: (context: RecipeContext) => Promise<void>;
}

/** Identity helper; exists so recipe files get type inference and a uniform shape. */
export function recipe(definition: Recipe): Recipe {
  return definition;
}
