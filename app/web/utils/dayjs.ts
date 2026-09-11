// Prefer Temporal and Intl APIs to dayjs, they're richer and safer.
// We still need dayjs for:
// - The MUI locale adapter needed for date/time pickers.
// - Formatting durations ("5 minutes"). Intl.RelativeTimeFormat always adds "in" or "ago".

// Register all locales we support with dayjs.
import "dayjs/locale/ca";
import "dayjs/locale/cs";
import "dayjs/locale/de";
import "dayjs/locale/en-gb"; // For our "en" locale (international English)
import "dayjs/locale/es";
import "dayjs/locale/fr";
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

// Dayjs-supported locale codes don't map 1:1 with our ISO locales
const DAYJS_LOCALE_REMAP: Record<string, string> = {
  // Our "en" is international English (dd/mm/yyyy, 12h clock)
  // dayjs doesn't have en-001, but en-au approximates it.
  en: "en-au",
  // dayjs' "en" locale uses US conventions (mm/dd/yyyy, 12h clock).
  "en-US": "en",
  "es-419": "es",
  "nb-NO": "nb",
  "pt-BR": "pt-br",
  "zh-Hans": "zh-cn",
  "zh-Hant": "zh-tw",
};

/** Maps a supported ISO locale code to the locale name used for formatting with dayjs. */
export function toDayjsLocale(locale: string): string {
  return DAYJS_LOCALE_REMAP[locale] ?? locale.toLowerCase();
}

export { Dayjs };
export default dayjs;
