import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const STORAGE_KEY = "@couchers/devUrlOverrides";

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:8888"; // fallback for tests

const DEFAULT_WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL || "http://localhost:3000";

const IS_PROD =
  (process.env.NEXT_PUBLIC_COUCHERS_ENV ||
    process.env.EXPO_PUBLIC_COUCHERS_ENV) === "prod";

export type UrlOverrides = {
  apiBaseUrl: string | null;
  webBaseUrl: string | null;
};

export type Preset = {
  label: string;
  apiBaseUrl: string;
  webBaseUrl: string;
};

// Known backends, offered as one-tap fills so common environments don't have
// to be typed by hand.
export const PRESETS: Preset[] = [
  {
    label: "Staging",
    apiBaseUrl: "https://dev-api.couchershq.org",
    webBaseUrl: "https://next.couchershq.org",
  },
  {
    label: "Production",
    apiBaseUrl: "https://api.couchers.org",
    webBaseUrl: "https://couchers.org",
  },
];

const HISTORY_KEY = "@couchers/devUrlHistory";
const HISTORY_LIMIT = 8;

let cache: UrlOverrides = { apiBaseUrl: null, webBaseUrl: null };

// Overriding the backend URLs is only allowed in non-prod builds, so a
// production app can never be pointed at a different backend, even if a
// stale override somehow ends up in storage.
export function isDevUrlOverrideEnabled(): boolean {
  return !IS_PROD;
}

function normalize(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\/+$/, "");
}

// Branch-preview OTA manifests carry their branch's web preview URL (injected
// by scripts/ota-bundle.mjs --web-base-url); it acts as the update's default.
function getManifestWebBaseUrl(): string | null {
  const value = Constants.expoConfig?.extra?.otaWebBaseUrl;
  return typeof value === "string" ? normalize(value) : null;
}

export function getDefaultApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

export function getDefaultWebBaseUrl(): string {
  if (isDevUrlOverrideEnabled()) {
    const fromManifest = getManifestWebBaseUrl();
    if (fromManifest) {
      return fromManifest;
    }
  }
  return DEFAULT_WEB_BASE_URL;
}

export function getApiBaseUrl(): string {
  if (isDevUrlOverrideEnabled() && cache.apiBaseUrl) {
    return cache.apiBaseUrl;
  }
  return DEFAULT_API_BASE_URL;
}

export function getWebBaseUrl(): string {
  if (isDevUrlOverrideEnabled() && cache.webBaseUrl) {
    return cache.webBaseUrl;
  }
  return getDefaultWebBaseUrl();
}

export function getUrlOverrides(): UrlOverrides {
  return { ...cache };
}

// Loads persisted overrides into the in-memory cache. Must run at startup
// before the gRPC client and webviews read their URLs.
export async function hydrateUrlOverrides(): Promise<void> {
  if (!isDevUrlOverrideEnabled()) {
    return;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UrlOverrides>;
      cache = {
        apiBaseUrl: normalize(parsed.apiBaseUrl),
        webBaseUrl: normalize(parsed.webBaseUrl),
      };
    }
  } catch {
    cache = { apiBaseUrl: null, webBaseUrl: null };
  }
}

export async function setUrlOverrides(overrides: UrlOverrides): Promise<void> {
  cache = {
    apiBaseUrl: normalize(overrides.apiBaseUrl),
    webBaseUrl: normalize(overrides.webBaseUrl),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  await addToHistory(cache);
}

export async function clearUrlOverrides(): Promise<void> {
  cache = { apiBaseUrl: null, webBaseUrl: null };
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function getUrlHistory(): Promise<UrlOverrides[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((e) => ({
        apiBaseUrl: normalize(e?.apiBaseUrl),
        webBaseUrl: normalize(e?.webBaseUrl),
      }))
      .filter((e) => e.apiBaseUrl || e.webBaseUrl);
  } catch {
    return [];
  }
}

export async function clearUrlHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

async function addToHistory(entry: UrlOverrides): Promise<void> {
  if (!entry.apiBaseUrl && !entry.webBaseUrl) {
    return;
  }
  const history = await getUrlHistory();
  const deduped = history.filter(
    (e) =>
      !(e.apiBaseUrl === entry.apiBaseUrl && e.webBaseUrl === entry.webBaseUrl),
  );
  const next = [entry, ...deduped].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}
