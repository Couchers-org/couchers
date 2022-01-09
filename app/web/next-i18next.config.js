module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  defaultNS: "global",
  fallbackLng: "en",
  compatibilityJSON: "v3",
  debug: process.env.NODE_ENV === "development",
  ns: [
    "global",
    "auth",
    "communities",
    "connections",
    "dashboard",
    "donations",
    "messages",
    "profile",
    "search",
  ],
  returnEmptyString: false,
  serializeConfig: false,
  localePath: (locale, namespace) => {
    if (namespace === "global") {
      return `resources/locales/${locale}.json`;
    }
    return `features/${namespace}/locales/${locale}.json`;
  },
};
