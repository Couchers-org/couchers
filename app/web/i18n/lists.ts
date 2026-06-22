const cache = new Map<string, string>();

/// Gets the list separator for the given locale.
export function listSeparatorForLocale(locale: string) {
  let separator = cache.get(locale);
  if (!separator) {
    // Intl.ListFormat doesn't have a way to format a list without using "and"/"or".
    // But we can extract the mid-list separator it uses, which is robust for Western, CJK and Arabic.
    // If the local is unknown, fallback to English, which uses commas.
    const formatter = new Intl.ListFormat([locale, "en"], {
      type: "conjunction",
      style: "long",
    });
    const formatParts = formatter.formatToParts(["a", "b", "c"]);
    separator = formatParts.find((p) => p.type === "literal")?.value || ", ";
    cache.set(locale, separator);
  }
  return separator;
}
