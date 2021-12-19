import resources from "i18n/resources";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "next-i18next";

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    compatibilityJSON: "v3",
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      // React does this by default already
      escapeValue: false,
    },
    resources: {
      en: resources,
    },
    ns: ["global"],
  });

export default i18n;
