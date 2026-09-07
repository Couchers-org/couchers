// Creating Intl.Segmenter every time is slow, so cache one per locale.
const segmenterCache = new Map<string, Intl.Segmenter>();

/**
 * Uppercases the first letter of a string (if capitalizable), leaving the rest untouched.
 */
export function capitalizeFirstLetter(value: string, locale: string): string {
  if (typeof Intl.Segmenter !== "function") {
    // Naive fallback for environments without Intl.Segmenter, like older Firefox browsers.
    if (!value) return value;
    return value[0].toLocaleUpperCase(locale) + value.slice(1);
  }

  let segmenter = segmenterCache.get(locale);
  if (!segmenter) {
    segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    segmenterCache.set(locale, segmenter);
  }
  const first = segmenter.segment(value)[Symbol.iterator]().next().value?.segment;
  if (!first) return value;
  return first.toLocaleUpperCase(locale) + value.slice(first.length);
}
