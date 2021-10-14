import i18n from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend((language, namespace, callback) => {
      import(`./features/${namespace}/locales/${language}.json`)
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
    debug: process.env.NODE_ENV === "development",
    interpolation: {
      // React does this by default already
      escapeValue: false,
      format(value, format, lng) {
        if (format) {
          const [formatType, ...rest] = format.split(",").map((v) => v.trim());
          if (formatType === "price") {
            const hasDecimal = value % 1 !== 0;
            return Intl.NumberFormat(lng, {
              style: "currency",
              currency: rest[0],
              minimumFractionDigits: hasDecimal ? 2 : 0,
            }).format(value);
          }
        }
        return value;
      },
    },
    ns: ["donations"],
  });

export default i18n;
