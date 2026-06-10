interface Language {
  // English name, used in localized sentences (e.g. settings copy).
  name: string;
  // Autonym: the language's name in its own language. Shown in the language
  // picker so each option is recognizable regardless of the current UI language.
  nativeName: string;
}

interface LanguageMap {
  [key: string]: Language;
}

export const LANGUAGE_MAP: LanguageMap = {
  ca: {
    name: "Catalan",
    nativeName: "Català",
  },
  cs: {
    name: "Czech",
    nativeName: "Čeština",
  },
  de: {
    name: "German",
    nativeName: "Deutsch",
  },
  en: {
    name: "English",
    nativeName: "English",
  },
  es: {
    name: "Spanish (Spain)",
    nativeName: "Español (España)",
  },
  "es-419": {
    name: "Spanish",
    nativeName: "Español (Latinoamérica)",
  },
  fr: {
    name: "French (France)",
    nativeName: "Français (France)",
  },
  "fr-CA": {
    name: "French (Canada)",
    nativeName: "Français (Canada)",
  },
  he: {
    name: "Hebrew",
    nativeName: "עברית",
  },
  hi: {
    name: "Hindi",
    nativeName: "हिन्दी",
  },
  hu: {
    name: "Hungarian",
    nativeName: "Magyar",
  },
  it: {
    name: "Italian",
    nativeName: "Italiano",
  },
  ja: {
    name: "Japanese",
    nativeName: "日本語",
  },
  "nb-NO": {
    name: "Norwegian (Bokmål)",
    nativeName: "Norsk (bokmål)",
  },
  nl: {
    name: "Dutch",
    nativeName: "Nederlands",
  },
  pl: {
    name: "Polish",
    nativeName: "Polski",
  },
  pt: {
    name: "Portuguese (Portugal)",
    nativeName: "Português (Portugal)",
  },
  "pt-BR": {
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
  },
  ru: {
    name: "Russian",
    nativeName: "Русский",
  },
  sv: {
    name: "Swedish",
    nativeName: "Svenska",
  },
  tr: {
    name: "Turkish",
    nativeName: "Türkçe",
  },
  uk: {
    name: "Ukrainian",
    nativeName: "Українська",
  },
  "zh-Hans": {
    name: "Chinese (Simplified)",
    nativeName: "中文（简体）",
  },
  "zh-Hant": {
    name: "Chinese (Traditional)",
    nativeName: "中文（繁體）",
  },
};
