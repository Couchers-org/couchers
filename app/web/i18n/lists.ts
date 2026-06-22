const cache = new Map<string, Intl.ListFormat>();

/// Localizes a list of items with appropriate commas and such.
export function localizeList(
  items: string[],
  {
    locale,
    type = "conjunction",
    style = "long",
  }: {
    locale: string;
    type?: Intl.ListFormatType;
    style?: Intl.ListFormatStyle;
  },
): string {
  const cacheKey = JSON.stringify({ locale, type, style });
  let formatter = cache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.ListFormat(locale, { type, style });
    cache.set(cacheKey, formatter);
  }
  return formatter.format(items);
}
