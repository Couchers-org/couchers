import resources from "i18n/resources";
import { TFunction as TFunctionOriginal } from "i18next";
import {
  Trans as nextTrans,
  useTranslation as nextUseTranslation,
} from "next-i18next";

export const Trans = nextTrans;
export const useTranslation = nextUseTranslation;
export type TFunction = TFunctionOriginal<
  (keyof typeof resources)[],
  undefined
>;
