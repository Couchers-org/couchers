const { NAMESPACES } = require("./i18n/namespaces");
const { allLanguages } = require("./i18n/allLanguages");

const fallbackLng = {
  default: ["en"],
  "pt-BR": ["pt_PT"],
  "pt-PT": ["pt_BR"],
  "es-419": ["es", "en"],
  "fr-CA": ["fr", "en"],
  zh: ["zh-Hans", "en"],
};

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: allLanguages,
  },
  fallbackLng,
  defaultNS: "global",
  compatibilityJSON: "v3",
  debug: process.env.NODE_ENV === "development",
  ns: NAMESPACES,
  returnEmptyString: false,
  serializeConfig: false,
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
