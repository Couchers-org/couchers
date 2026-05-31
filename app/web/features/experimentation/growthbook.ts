import { GrowthBook } from "@growthbook/growthbook";

import { recordExposure } from "./exposureLog";

const FLAGS_URL =
  process.env.NEXT_PUBLIC_FEATURE_FLAGS_URL ||
  "https://cdn.couchers.org/express/current.json";
const CACHE_KEY = "featureFlagsPayload";

export const growthbook = new GrowthBook({ trackingCallback: recordExposure });

export async function loadFeatureFlags(): Promise<void> {
  try {
    const payload = await (await fetch(FLAGS_URL)).json();
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    await growthbook.init({ payload });
    console.debug("Feature flags loaded from", FLAGS_URL);
  } catch (e) {
    const cached = localStorage.getItem(CACHE_KEY);
    console.debug(
      "Feature flags fetch failed, using cache:",
      cached != null,
      e,
    );
    await growthbook.init({ payload: cached ? JSON.parse(cached) : {} });
  }
}
