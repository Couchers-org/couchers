import { getFormatLocale } from "i18n/locales";

// Creating Intl.NumberFormat every time is slow, so cache one per locale+options.
const intlNumberFormatCache = new Map<string, Intl.NumberFormat>();

/** Gets a cached Intl.NumberFormat, applying our locale -> format-locale mapping. */
function getIntlNumberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const formatLocale = getFormatLocale(locale);
  const cacheKey = JSON.stringify({ ...options, locale: formatLocale });
  let format = intlNumberFormatCache.get(cacheKey);
  if (!format) {
    format = new Intl.NumberFormat(formatLocale, options);
    intlNumberFormatCache.set(cacheKey, format);
  }
  return format;
}

/** Localizes a USD amount, e.g. "$1,234" / "US$1,234" depending on locale. */
export function localizeUSD(amount: number, locale: string): string {
  return getIntlNumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
