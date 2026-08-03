import { LANGUAGE_MAP } from "i18n/constants";

import { ALMOST_DONE_CUTOFF, SELECTOR_CUTOFF } from "./constants";

export interface WeblateLanguage {
  code: string;
  translated_percent: number;
}

/**
 * Check if a language is production-ready (>= 80% translated)
 */
export function isLanguageProductionReady(locale: string, languages: WeblateLanguage[] | undefined): boolean {
  // English is always production-ready
  if (locale === "en") {
    return true;
  }

  if (!languages) {
    return false;
  }

  // Convert locale format (e.g., "es-419" to "es_419" for Weblate)
  const weblateCode = locale.replace("-", "_");
  const languageStats = languages.find((lang) => lang.code === weblateCode);

  return !!languageStats && languageStats.translated_percent >= ALMOST_DONE_CUTOFF;
}

/**
 * Filter languages for display in language picker (>= 50% translated by default)
 * @param languages - Array of languages with translation stats
 * @param showAll - If true, bypasses the SELECTOR_CUTOFF filter (for translators on stage)
 */
export function getAvailableLanguages(
  languages: WeblateLanguage[] | undefined,
  showAll = false,
  locale?: string,
): WeblateLanguage[] {
  if (!languages) {
    return [];
  }

  return languages
    .filter(
      (language) =>
        LANGUAGE_MAP[language.code.replace("_", "-")] && (showAll || language.translated_percent >= SELECTOR_CUTOFF),
    )
    .sort((a, b) => {
      // Sort by translation percentage (>= 80% first), then alphabetically
      if (a.translated_percent >= ALMOST_DONE_CUTOFF && b.translated_percent < ALMOST_DONE_CUTOFF) return -1;
      if (a.translated_percent < ALMOST_DONE_CUTOFF && b.translated_percent >= ALMOST_DONE_CUTOFF) return 1;
      return a.code.localeCompare(b.code, locale);
    });
}
