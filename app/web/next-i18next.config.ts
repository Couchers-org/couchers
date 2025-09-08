// const { NAMESPACES } = require("./i18n/namespaces");
// const { allLanguages } = require("./i18n/allLanguages");
import { UserConfig } from "next-i18next";
import path from "path";

import { allLanguages } from "./i18n/allLanguages";
import { NAMESPACES } from "./i18n/namespaces";

/* eslint-disable @typescript-eslint/naming-convention */
const fallbackLng = {
  default: ["en"],
  "pt-BR": ["pt", "en"],
  "pt-PT": ["pt_BR", "en"],
  "es-419": ["es", "en"],
  "fr-CA": ["fr", "en"],
  zh: ["zh-Hans", "en"],
};
/* eslint-enable @typescript-eslint/naming-convention */

// eslint-disable-next-line n/no-process-env
console.log(`Next 18n env: ${JSON.stringify(process.env)}`);

const userConfig: UserConfig = {
  i18n: {
    defaultLocale: "en",
    locales: allLanguages,
  },
  fallbackLng,
  defaultNS: "global",
  compatibilityJSON: "v3",
  // eslint-disable-next-line n/no-process-env
  debug: process.env.NODE_ENV === "development",
  ns: NAMESPACES,
  returnEmptyString: false,
  serializeConfig: false,
  localePath: (locale, namespace) => {
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

export default userConfig;
