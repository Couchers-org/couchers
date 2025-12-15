import resources from "@/i18n/resources";
import i18n from "i18next";
import {
  initReactI18next,
  useTranslation as nextUseTranslation,
} from "react-i18next";

export const useTranslation = nextUseTranslation;

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  compatibilityJSON: "v4",
  debug: __DEV__,
  interpolation: {
    escapeValue: false,
  },
  resources,
});

export default i18n;
