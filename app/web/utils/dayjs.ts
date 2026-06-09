// Locale data for every app language so dayjs can render month/day names and
// relative/duration strings in the user's language (en is built in). Importing
// a locale only registers it; the active locale is still switched explicitly
// via setDayjsLocale().
import "dayjs/locale/ca";
import "dayjs/locale/cs";
import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/fr-ca";
import "dayjs/locale/he";
import "dayjs/locale/hi";
import "dayjs/locale/hu";
import "dayjs/locale/it";
import "dayjs/locale/ja";
import "dayjs/locale/nb";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt";
import "dayjs/locale/pt-br";
import "dayjs/locale/ru";
import "dayjs/locale/sv";
import "dayjs/locale/tr";
import "dayjs/locale/uk";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";

import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import DurationPlugin from "dayjs/plugin/duration";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import RelativeTime from "dayjs/plugin/relativeTime";
import Timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(DurationPlugin);
dayjs.extend(RelativeTime);
dayjs.extend(Timezone);
dayjs.extend(LocalizedFormat);

// Maps an i18n language code to the matching dayjs locale name (they differ for
// some: e.g. "pt-BR" -> "pt-br", "zh-Hans" -> "zh-cn"). en is the built-in default.
const I18N_TO_DAYJS_LOCALE: Record<string, string> = {
  ca: "ca",
  cs: "cs",
  de: "de",
  en: "en",
  es: "es",
  "es-419": "es",
  fr: "fr",
  "fr-CA": "fr-ca",
  he: "he",
  hi: "hi",
  hu: "hu",
  it: "it",
  ja: "ja",
  "nb-NO": "nb",
  nl: "nl",
  pl: "pl",
  pt: "pt",
  "pt-BR": "pt-br",
  ru: "ru",
  sv: "sv",
  tr: "tr",
  uk: "uk",
  "zh-Hans": "zh-cn",
  "zh-Hant": "zh-tw",
};

/// Maps an i18n language code to a registered dayjs locale name, falling back to
/// the base language, then English, for unmapped codes. Use this for MUI's
/// LocalizationProvider `adapterLocale` as well as setDayjsLocale().
export function i18nToDayjsLocale(language: string): string {
  return (
    I18N_TO_DAYJS_LOCALE[language] ??
    I18N_TO_DAYJS_LOCALE[language.split("-")[0]] ??
    "en"
  );
}

/// Sets dayjs's global locale from an i18n language code, so localized dayjs
/// output (relative time, durations) matches the app language.
export function setDayjsLocale(language: string): void {
  dayjs.locale(i18nToDayjsLocale(language));
}

export { Dayjs };
export default dayjs;
