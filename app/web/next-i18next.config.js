const { NAMESPACES } = require("./i18n/namespaces");
const { allLanguages } = require("./i18n/allLanguages");

const fallbackLng = {
  default: ["en"],
  "es-419": ["es", "en"],
  "fr-CA": ["fr", "en"],
  pt: ["pt-BR", "en"],
  "pt-BR": ["pt", "en"],
  "zh-Hant": ["zh-Hans", "en"],
};

module.exports = {
  i18n: {
    defaultLocale: "en",
    localeDetection: true,
    locales: allLanguages,
  },
  fallbackLng,
  defaultNS: "global",
  compatibilityJSON: "v3",
  debug: process.env.NODE_ENV === "development",
  ns: NAMESPACES,
  returnEmptyString: false,
  serializeConfig: false,
  nonExplicitSupportedLngs: true, // Handle language codes like "zh-CN" and "zh-Hant" fallback to zh gracefully
  localePath: (locale, namespace) => {
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
