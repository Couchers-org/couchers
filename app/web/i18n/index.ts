import resources from "i18n/resources";
import {
  Trans as nextTrans,
  useTranslation as nextUseTranslation,
} from "next-i18next";
import { TFunction as TFunctionOriginal } from "react-i18next";

export const Trans = nextTrans;
export const useTranslation = nextUseTranslation;
export type TFunction = TFunctionOriginal<
  (keyof typeof resources)[],
  undefined
>;
