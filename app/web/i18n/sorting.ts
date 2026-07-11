function getLocalizedListSortLocales(language: string): string[] {
  if (language === "zh-Hans" || language.startsWith("zh-Hans-")) {
    // Simplified Chinese lists are conventionally sorted by romanized pinyin.
    return [
      "zh-Hans-u-co-pinyin",
      "zh-CN-u-co-pinyin",
      "zh-u-co-pinyin",
      language,
    ];
  }

  if (language === "zh-Hant" || language.startsWith("zh-Hant-")) {
    // Traditional Chinese lists are conventionally sorted by character strokes.
    return [
      "zh-Hant-u-co-stroke",
      "zh-TW-u-co-stroke",
      "zh-u-co-stroke",
      language,
    ];
  }

  return [language];
}

export function getLocalizedListComparer(
  language: string,
): Intl.Collator["compare"] {
  return new Intl.Collator(getLocalizedListSortLocales(language)).compare;
}
