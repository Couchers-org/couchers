/**
 * Build an `Accept-Language`-style value from an ordered list of preferred BCP-47
 * locales, most preferred first (e.g. i18next's `i18n.languages`, such as
 * `["pt-BR", "pt", "en"]`). Descending q-values make the order explicit
 * (`"pt-BR,pt;q=0.9,en;q=0.8"`), so a geocoding provider can apply the same
 * fallback chain as the UI. Returns `undefined` for an empty list.
 */
export function toAcceptLanguage(locales: readonly string[]): string | undefined {
  if (locales.length === 0) {
    return undefined;
  }
  return locales
    .map((locale, index) => (index === 0 ? locale : `${locale};q=${Math.max(1 - index * 0.1, 0.1).toFixed(1)}`))
    .join(",");
}
