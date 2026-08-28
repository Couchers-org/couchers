import { WeblateLanguage, weblateToISOLocale } from "./weblate";

// The name of the cookie storing the current locale.
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

// Final fallback locale if none other matches. Always available.
export const DEFAULT_LOCALE = "en";

// Locales which don't rely on translation progress.
export const ALWAYS_AVAILABLE_LOCALES = ["en"];

// Autonym = a language name as written in its own language.
// Module-private: consumers get a locale's autonym via AppLocale.autonym.
const LOCALE_AUTONYMS: Record<string, string> = {
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

export enum LocaleReadiness {
  JustStarted,
  EarlyStage,
  Midway,
  AlmostDone,
  Complete,
}

export interface AppLocale {
  code: string;
  autonym: string;
  percent: number;
}

export function getLocaleReadiness(percent: number): LocaleReadiness {
  // Mirrors the cutoffs in features/translate/constants.ts. That file's
  // consumers will be migrated to read `readiness` instead and it will be
  // removed as later steps of #9625 land; kept duplicated here in the
  // meantime to avoid a features/ -> i18n/ dependency.
  const EARLY_STAGE_PERCENTAGE = 20;
  const MIDWAY_PERCENTAGE = 50;
  const ALMOST_DONE_PERCENTAGE = 80;
  const COMPLETE_PERCENTAGE = 100;

  if (percent >= COMPLETE_PERCENTAGE) return LocaleReadiness.Complete;
  if (percent >= ALMOST_DONE_PERCENTAGE) return LocaleReadiness.AlmostDone;
  if (percent >= MIDWAY_PERCENTAGE) return LocaleReadiness.Midway;
  if (percent >= EARLY_STAGE_PERCENTAGE) return LocaleReadiness.EarlyStage;
  return LocaleReadiness.JustStarted;
}

/**
 * Gets the locales supported by our app based on Weblate-reported language stats,
 * and including always-available locales.
 */
export function getAppLocales(weblateLanguages: WeblateLanguage[]): AppLocale[] {
  const locales: Record<string, AppLocale> = {};

  for (const language of weblateLanguages) {
    const code = weblateToISOLocale(language.code);
    const autonym = LOCALE_AUTONYMS[code];
    if (!autonym) continue;

    locales[code] = {
      code,
      autonym,
      percent: language.translated_percent,
    };
  }

  for (const code of ALWAYS_AVAILABLE_LOCALES) {
    locales[code] = {
      code,
      autonym: LOCALE_AUTONYMS[code],
      percent: 100,
    };
  }

  return Object.values(locales);
}

export function isLocaleProductionReady(locale: AppLocale | undefined): boolean {
  return locale !== undefined && getLocaleReadiness(locale.percent) >= LocaleReadiness.AlmostDone;
}

export function isLocaleSelectable(locale: AppLocale | undefined): boolean {
  return locale !== undefined && getLocaleReadiness(locale.percent) >= LocaleReadiness.Midway;
}
