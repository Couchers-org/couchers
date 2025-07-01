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
};
