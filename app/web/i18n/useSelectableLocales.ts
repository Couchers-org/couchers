import { useShowAllLanguages } from "features/translate/useShowAllLanguages";
import { allLanguages } from "i18n/allLanguages";
import { LOCALE_AUTONYMS } from "i18n/locales";
import {
  getLocaleBundledTranslationReadiness,
  SELECTABLE_THRESHOLD,
  TranslationReadiness,
} from "i18n/translationReadiness";
import { useMemo } from "react";

export interface SelectableLocaleInfo {
  code: string;
  autonym: string;
  readiness: TranslationReadiness;
}

/**
 * Gets the locales the user can select, based on bundled translation readiness (not Weblate).
 */
export function useSelectableLocales(): SelectableLocaleInfo[] {
  const { showAllLanguages } = useShowAllLanguages();

  return useMemo(
    () =>
      allLanguages
        .map((code) => ({
          code,
          autonym: LOCALE_AUTONYMS[code],
          readiness: getLocaleBundledTranslationReadiness(code),
        }))
        .filter((localeInfo) => showAllLanguages || localeInfo.readiness >= SELECTABLE_THRESHOLD),
    [showAllLanguages],
  );
}
