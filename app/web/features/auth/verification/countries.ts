import { getCountries } from "react-phone-number-input";

export type CountryOption = { code: string; name: string };

/**
 * ISO 3166-1 alpha-2 codes with localized names, sorted for the given language.
 * The code list is borrowed from react-phone-number-input's metadata (already a
 * dependency) so we don't ship a second copy of the world.
 */
export function getLocalizedCountries(language: string): CountryOption[] {
  const displayNames = new Intl.DisplayNames([language], { type: "region", fallback: "code" });
  const collator = new Intl.Collator(language);

  return getCountries()
    .map((code) => ({ code, name: displayNames.of(code) ?? code }))
    .sort((a, b) => collator.compare(a.name, b.name));
}
