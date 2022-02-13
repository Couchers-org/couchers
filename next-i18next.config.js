const { NAMESPACES } = require("./i18n/namespaces");
const { allLanguages } = require("./i18n/allLanguages");

const fallbackLng = {
  default: ["en"],
  pt: ["pt-PT"],
  "pt-BR": ["pt-PT"],
  "pt-PT": ["pt-BR"],
  zh: ["zh-Hans", "en"],
  "zh-CN": ["zh-Hans", "en"],
  "zh-HK": ["zh-Hant", "zh-Hans", "en"],
  "zh-SG": ["zh-Hant", "zh-Hans", "en"],
  "zh-TW": ["zh-Hant", "zh-Hans", "en"],
};

module.exports = {
  i18n: {
    defaultLocale: "en",
    localeDetection: false,
    locales:
      process.env.NEXT_PUBLIC_COUCHERS_ENV === "prod" ? ["en"] : allLanguages,
    fallbackLng,
  },
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
        `resources/locales/${locale.replace("-", "_")}.json`
      );
    }
    return path.resolve(
      process.cwd(),
      `features/${namespace}/locales/${locale.replace("-", "_")}.json`
    );
  },
};
