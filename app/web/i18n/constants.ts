interface Language {
  name: string;
  flagIconCode: string;
}

interface LanguageMap {
  [key: string]: Language;
}

export const LANGUAGE_MAP: LanguageMap = {
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
  it: {
    name: "Italian",
    flagIconCode: "IT",
  },
  ja: {
    name: "Japanese",
    flagIconCode: "JP",
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
};
