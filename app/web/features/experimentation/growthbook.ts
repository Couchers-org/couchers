import { GrowthBook } from "@growthbook/growthbook";

import { recordExposure } from "./exposureLog";

const FLAGS_URL =
  process.env.NEXT_PUBLIC_FEATURE_FLAGS_URL ||
  "https://cdn.couchers.org/ff/flags.json";
const CACHE_KEY = "featureFlagsPayload";

export const growthbook = new GrowthBook({ trackingCallback: recordExposure });

export async function loadFeatureFlags(): Promise<void> {
  try {
    const payload = await (await fetch(FLAGS_URL)).json();
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    await growthbook.init({ payload });
  } catch {
    const cached = localStorage.getItem(CACHE_KEY);
    await growthbook.init({ payload: cached ? JSON.parse(cached) : {} });
  }
}
