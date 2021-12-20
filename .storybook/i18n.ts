import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend((language, namespace, callback) => {
      import(`public/locales/${language}/${namespace}.json`)
        .then((resources) => {
          callback(null, resources);
        })
        .catch((error) => {
          callback(error, null);
        });
    })
  )
  .init({
    fallbackLng: "en",
    compatibilityJSON: "v3",
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      // React does this by default already
      escapeValue: false,
    },
    ns: ["global"],
    returnEmptyString: false,
  });

export default i18n;
