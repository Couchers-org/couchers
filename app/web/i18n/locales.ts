import { WeblateLanguage, weblateToISOLocale } from "./weblate";

// The name of the cookie storing the current locale.
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

// Final fallback locale if none other matches. Always available.
export const DEFAULT_LOCALE = "en";

// Locales which don't rely on translation progress.
export const ALWAYS_AVAILABLE_LOCALES = ["en"];

// Autonym = a language name as written in its own language.
export const LOCALE_AUTONYMS: Record<string, string> = {
  ca: "Català",
  cs: "Čeština",
  de: "Deutsch",
  en: "English",
  es: "Español (España)",
  "es-419": "Español (Latinoamérica)",
  fr: "Français",
  he: "עברית",
  hi: "हिन्दी",
  hu: "Magyar",
  it: "Italiano",
  ja: "日本語",
  "nb-NO": "Norsk (bokmål)",
  nl: "Nederlands",
  pl: "Polski",
  pt: "Português (Portugal)",
  "pt-BR": "Português (Brasil)",
  ru: "Русский",
  sv: "Svenska",
  tr: "Türkçe",
  uk: "Українська",
  "zh-Hans": "中文（简体）",
  "zh-Hant": "中文（繁體）",
};

export interface LocaleInfo {
  code: string;
  autonym: string;
  stringAvailabilityPercent: number;
}

/**
 * Gets the locales supported by our app based on Weblate-reported language stats,
 * and including always-available locales.
 */
export function getLocaleInfos(weblateLanguages: WeblateLanguage[]): LocaleInfo[] {
  const locales: Record<string, LocaleInfo> = {};

  for (const language of weblateLanguages) {
    const code = weblateToISOLocale(language.code);
    const autonym = LOCALE_AUTONYMS[code];
    if (!autonym) continue;

    locales[code] = {
      code,
      autonym,
      stringAvailabilityPercent: language.translated_percent,
    };
  }

  for (const code of ALWAYS_AVAILABLE_LOCALES) {
    locales[code] = {
      code,
      autonym: LOCALE_AUTONYMS[code],
      stringAvailabilityPercent: 100,
    };
  }

  return Object.values(locales);
}

export enum LocaleReadiness {
  JustStarted,
  EarlyStage,
  Midway,
  AlmostDone,
  Complete,
}

export function getLocaleReadiness(stringAvailabilityPercent: number): LocaleReadiness {
  const EARLY_STAGE_PERCENTAGE = 20;
  const MIDWAY_PERCENTAGE = 50;
  const ALMOST_DONE_PERCENTAGE = 80;
  const COMPLETE_PERCENTAGE = 100;

  if (stringAvailabilityPercent >= COMPLETE_PERCENTAGE) return LocaleReadiness.Complete;
  if (stringAvailabilityPercent >= ALMOST_DONE_PERCENTAGE) return LocaleReadiness.AlmostDone;
  if (stringAvailabilityPercent >= MIDWAY_PERCENTAGE) return LocaleReadiness.Midway;
  if (stringAvailabilityPercent >= EARLY_STAGE_PERCENTAGE) return LocaleReadiness.EarlyStage;
  return LocaleReadiness.JustStarted;
}

export function isLocaleProductionReady(locale: LocaleInfo): boolean {
  return getLocaleReadiness(locale.stringAvailabilityPercent) >= LocaleReadiness.AlmostDone;
}

export function isLocaleSelectable(locale: LocaleInfo): boolean {
  return getLocaleReadiness(locale.stringAvailabilityPercent) >= LocaleReadiness.Midway;
}
