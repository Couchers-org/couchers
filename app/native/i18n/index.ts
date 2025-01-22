import resources from "i18n/resources";
import i18n from "i18next";
import {
  initReactI18next,
  Trans as nextTrans,
  useTranslation as nextUseTranslation,
} from "react-i18next";
import type { TFunction as TFunctionOriginal } from "i18next";

export const Trans = nextTrans;
export const useTranslation = nextUseTranslation;
export type TFunction = TFunctionOriginal<
  (keyof typeof resources)[],
  undefined
>;

i18n.use(initReactI18next).init({
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
