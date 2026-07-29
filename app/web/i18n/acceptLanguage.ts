interface AcceptLanguageEntry {
  code: string;
  quality: number;
}

/** Parses the Accept-Language HTTP header (e.g., "en-US,en;q=0.9,fr;q=0.8"). */
export function parseAcceptLanguage(header: string): AcceptLanguageEntry[] {
  return header
    .split(",")
    .map((item) => {
      const [code, q = "1"] = item.trim().split(";q=");
      return { code: code, quality: parseFloat(q) };
    })
    .filter((entry) => entry.code.length > 0);
}

/** Looks up a supported locale based on an Accept-Language HTTP header. */
export function lookupAcceptLanguage(
  header: string,
  supportedLocales: string[],
): string | undefined {
  // Consider accepted locales by descending quality.
  const acceptLocales = parseAcceptLanguage(header)
    .sort((a, b) => b.quality - a.quality)
    .map((e) => e.code);

  for (const acceptLocale of acceptLocales) {
    // RFC 4647 lookup: First check pt-BR, then pt
    let possibleLocale = acceptLocale;
    while (true) {
      if (supportedLocales.includes(possibleLocale)) {
        return possibleLocale;
      }

      // Strip the last suffix
      const lastDashIndex = possibleLocale.lastIndexOf("-");
      if (lastDashIndex === -1) break;
      possibleLocale = possibleLocale.slice(0, lastDashIndex);
    }
  }

  return undefined;
}
