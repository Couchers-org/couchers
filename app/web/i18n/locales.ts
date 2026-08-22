// Autonyms: each language's name in its own language. Shown in the language
// picker so each option is recognizable regardless of the current UI language.
export const LOCALE_NATIVE_NAMES: Record<string, string> = {
  ca: "Català",
  cs: "Čeština",
  de: "Deutsch",
  en: "English (International)",
  "en-US": "English (US)",
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

/**
 * English locales, always fully available, no need to ask Weblate.
 * They only differ on regional formats (especially dates).
 */
export const ENGLISH_LOCALES = ["en", "en-US"];

/**
 * Maps an app locale to the locale to use for formatting with Intl APIs.
 * We must support "en" because Accept-Language headers specify it,
 * but it defaults to US formats, whereas we want international English (en-001).
 */
export function getFormatLocale(language: string): string {
  return language === "en" ? "en-001" : language;
}
