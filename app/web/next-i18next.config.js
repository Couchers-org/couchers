// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NAMESPACES_VALUES } = require("./i18n/namespaces");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  defaultNS: "global",
  fallbackLng: "en",
  compatibilityJSON: "v3",
  debug: process.env.NODE_ENV === "development",
  ns: NAMESPACES_VALUES,
  returnEmptyString: false,
  serializeConfig: false,
  localePath: (locale, namespace) => {
    if (namespace === "global") {
      return `resources/locales/${locale}.json`;
    }
    return `features/${namespace}/locales/${locale}.json`;
  },
};
