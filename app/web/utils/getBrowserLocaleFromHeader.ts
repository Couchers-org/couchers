/**
 * Detects the user's preferred locale from the Accept-Language header
 *
 * Parses the Accept-Language header (e.g., "en-US,en;q=0.9,fr;q=0.8"),
 * extracts language codes with their quality values, and returns the first
 * supported locale based on priority.
 *
 * @param acceptLanguage - The Accept-Language header value from the browser
 * @param supportedLocales - Array of supported locale codes (e.g., ["en", "fr", "de"])
 * @returns The best matching supported locale, or undefined if no match found
 *
 * @example
 * getBrowserLocaleFromHeader("fr-FR,fr;q=0.9,en;q=0.8", ["en", "fr", "de"])
 * // Returns "fr"
 */
function getBrowserLocaleFromHeader(
  acceptLanguage: string | undefined,
  supportedLocales: string[],
): string | undefined {
  if (!acceptLanguage) return undefined;

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, q = "1"] = lang.trim().split(";q=");
      return { code: code.split("-")[0], quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const lang of languages) {
    const match = supportedLocales.find((supported) =>
      supported.startsWith(lang.code),
    );
    if (match) return match;
  }

  return undefined;
}

export { getBrowserLocaleFromHeader };
