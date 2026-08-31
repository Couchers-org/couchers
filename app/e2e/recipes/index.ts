import { Recipe } from "../runner/recipe";
import * as auth from "./auth.recipe";
import * as landing from "./landing.recipe";
import * as member from "./member.recipe";

/**
 * Every recipe, in one list. Add a new file next to these and spread its
 * exports in here; the runner picks it up from there.
 */
export const RECIPES: Recipe[] = [
  ...Object.values(landing),
  ...Object.values(auth),
  ...Object.values(member),
];

const duplicates = RECIPES.map((r) => r.id).filter((id, i, ids) => ids.indexOf(id) !== i);
if (duplicates.length > 0) {
  throw new Error(`Duplicate recipe ids: ${[...new Set(duplicates)].join(", ")}`);
}
