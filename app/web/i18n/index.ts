import { TFunction as TFunctionOriginal } from "i18next";
import { useTranslation as nextUseTranslation } from "next-i18next";

import resources from "@/i18n/resources";

export { Trans } from "next-i18next";
export const useTranslation = nextUseTranslation;
export type TFunction = TFunctionOriginal<(keyof typeof resources)[]>;
