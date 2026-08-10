// eslint-disable-next-line
const { NAMESPACES } = require("./i18n/namespaces");
// eslint-disable-next-line
const { allLanguages } = require("./i18n/allLanguages");

const fallbackLng = {
  default: ["en"],
  "pt-BR": ["pt", "en"],
  pt: ["pt-BR", "en"],
  "es-419": ["es", "en"],
  es: ["es-419", "en"],
  zh: ["zh-Hans", "en"],
};

const debugLogging = process.env.NODE_ENV === "development";

// Dedupe client-side missing-key reports so a key missing on a page doesn't
// flood Sentry on every render/navigation.
const reportedMissingKeys = new Set();

// Fires whenever a key resolves to nothing across the whole fallback chain.
// At build time this fails the build so a missing key never ships; in the
// browser it reports to Sentry to catch what the build can't see (soft-nav
// races, stale WebView caches after a deploy, etc).
function missingKeyHandler(lngs, ns, key) {
  if (typeof window === "undefined") {
    // Only throw during `next build` (static generation). Don't throw in dev
    // or in live SSR, where it would crash the page for a single missing key.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      throw new Error(
        `Missing i18n key "${ns}:${key}" (tried: ${(lngs || []).join(", ")}). ` +
          `Add it to the en source locale, or include the "${ns}" namespace ` +
          `in this page's serverSideTranslations().`,
      );
    }
    return;
  }

  const pathname = window.location.pathname;
  const dedupeKey = `${ns}:${key}@${pathname}`;
  if (reportedMissingKeys.has(dedupeKey)) return;
  reportedMissingKeys.add(dedupeKey);

  // eslint-disable-next-line
  const Sentry = require("@sentry/nextjs");
  Sentry.captureMessage(`Missing i18n key: ${ns}:${key}`, {
    level: "warning",
    fingerprint: ["i18n-missing-key", ns, key],
    tags: {
      i18n_namespace: ns,
      i18n_key: key,
      i18n_language: (lngs && lngs[0]) || "unknown",
    },
    extra: {
      languages_tried: lngs,
      pathname,
      build_id: window.__NEXT_DATA__ && window.__NEXT_DATA__.buildId,
    },
  });
}

if (debugLogging) {
  // i18next's debug logging at the "log" level is extremely verbose,
  // including all loaded strings, and drowning out warnings and errors.
  // Unfortunately i18next doesn't provide a way to filter its debug logs,
  // so we're left with patching console.log.
  const originalLog = console.log;
  console.log = (...args) => {
    if (args[0] && typeof args[0] === "string" && args[0].startsWith("i18next:")) {
      // Filter out i18next debug logs
      return;
    }
    originalLog(...args);
  };
}

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: allLanguages,
    localeDetection: false, // Disabled - using custom middleware for locale detection
  },
  fallbackLng,
  defaultNS: "global",
  compatibilityJSON: "v4",
  debug: debugLogging,
  ns: NAMESPACES,
  returnEmptyString: false,
  serializeConfig: false,
  saveMissing: true,
  missingKeyHandler,
  localePath: (locale, namespace) => {
    // eslint-disable-next-line
    const path = require("path");
    if (namespace === "global") {
      return path.resolve(process.cwd(), `resources/locales/${locale.replace("-", "_")}.json`);
    }
    if (namespace == "mod") {
      // Localization is not supported for the moderation namespace.
      locale = "en";
    }
    return path.resolve(process.cwd(), `features/${namespace}/locales/${locale.replace("-", "_")}.json`);
  },
};
