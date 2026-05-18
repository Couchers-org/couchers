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
  "fr-CA": ["fr", "en"],
  zh: ["zh-Hans", "en"],
};

const debugLogging = process.env.NODE_ENV === "development";

if (debugLogging) {
  // i18next's debug logging at the "log" level is extremely verbose,
  // including all loaded strings, and drowning out warnings and errors.
  // Unfortunately i18next doesn't provide a way to filter its debug logs,
  // so we're left with patching console.log.
  const originalLog = console.log;
  console.log = (...args) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].startsWith("i18next:")
    ) {
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
  localePath: (locale, namespace) => {
    // eslint-disable-next-line
    const path = require("path");
    if (namespace === "global") {
      return path.resolve(
        process.cwd(),
        `resources/locales/${locale.replace("-", "_")}.json`,
      );
    }
    if (namespace == "mod") {
      // Localization is not supported for the moderation namespace.
      locale = "en";
    }
    return path.resolve(
      process.cwd(),
      `features/${namespace}/locales/${locale.replace("-", "_")}.json`,
    );
  },
};
