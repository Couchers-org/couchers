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
