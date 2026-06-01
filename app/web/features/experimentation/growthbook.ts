import { FeatureApiResponse, GrowthBook } from "@growthbook/growthbook";

import { recordExposure } from "./exposureLog";

const FLAGS_URL =
  process.env.NEXT_PUBLIC_FEATURE_FLAGS_URL ||
  "https://cdn.couchers.org/express/current.json";
const CACHE_KEY = "featureFlagsPayload";
// At startup we reuse the cache without a network fetch unless it's older than this.
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const REFRESH_INTERVAL_MS = 60 * 1000;

export const growthbook = new GrowthBook({ trackingCallback: recordExposure });

type CachedFlags = { fetchedAt: number; payload: FeatureApiResponse };

function readCache(): CachedFlags | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return typeof parsed?.fetchedAt === "number" && parsed.payload
      ? parsed
      : null;
  } catch {
    return null;
  }
}

async function fetchAndCache(): Promise<FeatureApiResponse> {
  const payload = await (await fetch(FLAGS_URL)).json();
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ fetchedAt: Date.now(), payload }),
  );
  return payload;
}

export async function loadFeatureFlags(): Promise<void> {
  const cached = readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_MAX_AGE_MS) {
    await growthbook.init({ payload: cached.payload });
    console.debug("Feature flags loaded from cache");
    return;
  }
  try {
    const payload = await fetchAndCache();
    await growthbook.init({ payload });
    console.debug("Feature flags loaded from", FLAGS_URL);
  } catch (e) {
    console.debug(
      "Feature flags fetch failed, using cache:",
      cached != null,
      e,
    );
    await growthbook.init({ payload: cached ? cached.payload : {} });
  }
}

async function refreshFeatureFlags(): Promise<void> {
  try {
    await growthbook.setPayload(await fetchAndCache());
    console.debug("Feature flags refreshed");
  } catch (e) {
    console.debug("Feature flags refresh failed", e);
  }
}

export function startFeatureFlagRefresh(): () => void {
  const id = setInterval(() => void refreshFeatureFlags(), REFRESH_INTERVAL_MS);
  // Timers are throttled while the tab/webview is hidden, so refresh on return to keep flags fresh.
  const onVisible = () => {
    if (document.visibilityState === "visible") void refreshFeatureFlags();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
