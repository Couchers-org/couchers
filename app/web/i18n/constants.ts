interface Language {
  // Autonym: the language's name in its own language. Shown in the language
  // picker so each option is recognizable regardless of the current UI language.
  nativeName: string;
}

interface LanguageMap {
  [key: string]: Language;
}

export const LANGUAGE_MAP: LanguageMap = {
  ca: {
    nativeName: "Català",
  },
  cs: {
    nativeName: "Čeština",
  },
  de: {
    nativeName: "Deutsch",
  },
  en: {
    nativeName: "English",
  },
  es: {
    nativeName: "Español (España)",
  },
  "es-419": {
    nativeName: "Español (Latinoamérica)",
  },
  fr: {
    nativeName: "Français (France)",
  },
  "fr-CA": {
    nativeName: "Français (Canada)",
  },
  he: {
    nativeName: "עברית",
  },
  hi: {
    nativeName: "हिन्दी",
  },
  hu: {
    nativeName: "Magyar",
  },
  it: {
    nativeName: "Italiano",
  },
  ja: {
    nativeName: "日本語",
  },
  "nb-NO": {
    nativeName: "Norsk (bokmål)",
  },
  nl: {
    nativeName: "Nederlands",
  },
  pl: {
    nativeName: "Polski",
  },
  pt: {
    nativeName: "Português (Portugal)",
  },
  "pt-BR": {
    nativeName: "Português (Brasil)",
  },
  ru: {
    nativeName: "Русский",
  },
  sv: {
    nativeName: "Svenska",
  },
  tr: {
    nativeName: "Türkçe",
  },
  uk: {
    nativeName: "Українська",
  },
  "zh-Hans": {
    nativeName: "中文（简体）",
  },
  "zh-Hant": {
    nativeName: "中文（繁體）",
  },
};
