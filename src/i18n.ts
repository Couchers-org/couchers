import i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend((language, namespace, callback) => {
      if (namespace !== "global") {
        import(`./features/${namespace}/locales/${language}.json`)
          .then((resources) => {
            callback(null, resources);
          })
          .catch((error) => {
            callback(error, null);
          });
        return;
      }
      import(`./features/locales/${language}.json`)
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
    ns: ["donations"],
  });

export default i18n;
