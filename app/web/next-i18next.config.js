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

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: allLanguages,
    localeDetection: false, // Disabled - using custom middleware for locale detection
  },
  fallbackLng,
  defaultNS: "global",
  compatibilityJSON: "v4",
  debug: process.env.NODE_ENV === "development",
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
    return path.resolve(
      process.cwd(),
      `features/${namespace}/locales/${locale.replace("-", "_")}.json`,
    );
  },
};
