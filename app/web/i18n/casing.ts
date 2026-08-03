// Creating Intl.Segmenter every time is slow, so cache one per locale.
const segmenterCache = new Map<string, Intl.Segmenter>();

/**
 * Uppercases the first grapheme cluster of a string, leaving the rest untouched.
 * Non-capitalizable first clusters (digits, CJK, etc.) are returned unchanged.
 * Only for strings that stand alone (their own "sentence") — never for text
 * interpolated into a larger translated string.
 */
export function capitalizeFirstLetter(value: string, locale: string): string {
  let segmenter = segmenterCache.get(locale);
  if (!segmenter) {
    segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    segmenterCache.set(locale, segmenter);
  }
  const first = segmenter.segment(value)[Symbol.iterator]().next().value?.segment;
  if (!first) return value;
  return first.toLocaleUpperCase(locale) + value.slice(first.length);
}
