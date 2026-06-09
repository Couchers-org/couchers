interface Language {
  // English name, used in localized sentences (e.g. settings copy).
  name: string;
  // Autonym: the language's name in its own language. Shown in the language
  // picker so each option is recognizable regardless of the current UI language.
  nativeName: string;
  flagIconCode: string;
}

interface LanguageMap {
  [key: string]: Language;
}

export const LANGUAGE_MAP: LanguageMap = {
  ca: {
    name: "Catalan",
    nativeName: "Català",
    flagIconCode: "CAT",
  },
  cs: {
    name: "Czech",
    nativeName: "Čeština",
    flagIconCode: "CZ",
  },
  de: {
    name: "German",
    nativeName: "Deutsch",
    flagIconCode: "DE",
  },
  en: {
    name: "English",
    nativeName: "English",
    flagIconCode: "GB",
  },
  es: {
    name: "Spanish (Spain)",
    nativeName: "Español (España)",
    flagIconCode: "ES",
  },
  "es-419": {
    name: "Spanish",
    nativeName: "Español (Latinoamérica)",
    flagIconCode: "MX",
  },
  fr: {
    name: "French (France)",
    nativeName: "Français (France)",
    flagIconCode: "FR",
  },
  "fr-CA": {
    name: "French (Canada)",
    nativeName: "Français (Canada)",
    flagIconCode: "CA",
  },
  he: {
    name: "Hebrew",
    nativeName: "עברית",
    flagIconCode: "IL",
  },
  hi: {
    name: "Hindi",
    nativeName: "हिन्दी",
    flagIconCode: "IN",
  },
  hu: {
    name: "Hungarian",
    nativeName: "Magyar",
    flagIconCode: "HU",
  },
  it: {
    name: "Italian",
    nativeName: "Italiano",
    flagIconCode: "IT",
  },
  ja: {
    name: "Japanese",
    nativeName: "日本語",
    flagIconCode: "JP",
  },
  "nb-NO": {
    name: "Norwegian (Bokmål)",
    nativeName: "Norsk (bokmål)",
    flagIconCode: "NO",
  },
  nl: {
    name: "Dutch",
    nativeName: "Nederlands",
    flagIconCode: "NL",
  },
  pl: {
    name: "Polish",
    nativeName: "Polski",
    flagIconCode: "PL",
  },
  pt: {
    name: "Portuguese (Portugal)",
    nativeName: "Português (Portugal)",
    flagIconCode: "PT",
  },
  "pt-BR": {
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    flagIconCode: "BR",
  },
  ru: {
    name: "Russian",
    nativeName: "Русский",
    flagIconCode: "RU",
  },
  sv: {
    name: "Swedish",
    nativeName: "Svenska",
    flagIconCode: "SE",
  },
  tr: {
    name: "Turkish",
    nativeName: "Türkçe",
    flagIconCode: "TR",
  },
  uk: {
    name: "Ukrainian",
    nativeName: "Українська",
    flagIconCode: "UA",
  },
  "zh-Hans": {
    name: "Chinese (Simplified)",
    nativeName: "中文（简体）",
    flagIconCode: "CN",
  },
  "zh-Hant": {
    name: "Chinese (Traditional)",
    nativeName: "中文（繁體）",
    flagIconCode: "CN",
  },
};
