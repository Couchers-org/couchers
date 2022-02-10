// eslint-disable-next-line @typescript-eslint/no-var-requires
const { NAMESPACES } = require("./i18n/namespaces");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  defaultNS: "global",
  fallbackLng: "en",
  compatibilityJSON: "v3",
  debug: process.env.NODE_ENV === "development",
  ns: NAMESPACES,
  returnEmptyString: false,
  serializeConfig: false,
  localePath: (locale, namespace) => {
    const path = require("path");
    if (namespace === "global") {
      return path.resolve(process.cwd(), `resources/locales/${locale}.json`);
    }
    return path.resolve(
      process.cwd(),
      `features/${namespace}/locales/${locale}.json`
    );
  },
};
