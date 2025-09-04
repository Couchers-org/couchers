import { TFunction as TFunctionOriginal } from "i18next";
import {
  Trans as nextTrans,
  useTranslation as nextUseTranslation,
} from "next-i18next";

import resources from "@/i18n/resources";

export const Trans = nextTrans;
export const useTranslation = nextUseTranslation;
export type TFunction = TFunctionOriginal<
  (keyof typeof resources)[],
  undefined
>;
