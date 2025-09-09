import { WeblateLanguage } from "@/features/weblate/useWeblateStats";
import { LANGUAGE_MAP, Language } from "@/i18n/constants";

export const getLanguageFromCode = (code: string): Language | undefined => {
  if (Object.hasOwn(LANGUAGE_MAP, code)) {
    return (LANGUAGE_MAP as Record<string, Language>)[code];
  }

  return undefined;
};

export const getLanguageCodeFromWeblateLanguage = (
  weblateLanguage: WeblateLanguage,
) => weblateLanguage.code.replace("_", "-");

export const getLanguageFromWeblateLanguage = (
  weblateLanguage: WeblateLanguage,
) => getLanguageFromCode(getLanguageCodeFromWeblateLanguage(weblateLanguage));
