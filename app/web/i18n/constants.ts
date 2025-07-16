interface Language {
  name: string;
  flagIconCode: string;
}

interface LanguageMap {
  [key: string]: Language;
}

export const LANGUAGE_MAP: LanguageMap = {
  cs: {
    name: "Czech",
    flagIconCode: "CZ",
  },
  de: {
    name: "German",
    flagIconCode: "DE",
  },
  en: {
    name: "English",
    flagIconCode: "GB",
  },
  es: {
    name: "Spanish (Spain)",
    flagIconCode: "ES",
  },
  "es-419": {
    name: "Spanish",
    flagIconCode: "MX",
  },
  fr: {
    name: "French (France)",
    flagIconCode: "FR",
  },
  "fr-CA": {
    name: "French (Canada)",
    flagIconCode: "CA",
  },
  hi: {
    name: "Hindi",
    flagIconCode: "IN",
  },
  it: {
    name: "Italian",
    flagIconCode: "IT",
  },
  ja: {
    name: "Japanese",
    flagIconCode: "JP",
  },
  "nb-NO": {
    name: "Norwegian (Bokmål)",
    flagIconCode: "NO",
  },
  pl: {
    name: "Polish",
    flagIconCode: "PL",
  },
  pt: {
    name: "Portuguese",
    flagIconCode: "PT",
  },
  "pt-BR": {
    name: "Portuguese (Brazil)",
    flagIconCode: "BR",
  },
  ru: {
    name: "Russian",
    flagIconCode: "RU",
  },
  sv: {
    name: "Swedish",
    flagIconCode: "SE",
  },
  uk: {
    name: "Ukrainian",
    flagIconCode: "UA",
  },
  "zh-Hans": {
    name: "Chinese (Simplified)",
    flagIconCode: "CN",
  },
  "zh-Hant": {
    name: "Chinese (Traditional)",
    flagIconCode: "CN",
  },
};
