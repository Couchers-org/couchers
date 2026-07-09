// format a date
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Temporal } from "temporal-polyfill";

import { dayMillis } from "./timeAgo";

// Creating Intl.Segmenter every time is slow, so cache one per locale.
const segmenterCache = new Map<string, Intl.Segmenter>();

/// Uppercases the first grapheme cluster of a string, leaving the rest untouched.
/// Non-capitalizable first clusters (digits, CJK, etc.) are returned unchanged.
/// Only for dates that stand alone (their own "sentence") — never for dates
/// interpolated into a larger translated string.
function capitalizeFirstLetter(value: string, locale: string): string {
  let segmenter = segmenterCache.get(locale);
  if (!segmenter) {
    segmenter = new Intl.Segmenter(locale, { granularity: "grapheme" });
    segmenterCache.set(locale, segmenter);
  }
  const first = segmenter.segment(value)[Symbol.iterator]().next()
    .value?.segment;
  if (!first) return value;
  return first.toLocaleUpperCase(locale) + value.slice(first.length);
}

const numNights = (date1: string, date2: string) => {
  const diffTime = Date.parse(date1) - Date.parse(date2);
  const diffDays = Math.ceil(diffTime / dayMillis);
  return diffDays;
};

/// Converts a Temporal.PlainDate[Time] to a Date, interpreting it in UTC timezone.
function toUTCDate(
  temporal: Temporal.PlainDate | Temporal.PlainDateTime,
): Date {
  if (temporal instanceof Temporal.PlainDate) {
    temporal = temporal.toPlainDateTime();
  }
  const zoned = temporal.toZonedDateTime("Etc/UTC");
  return new Date(zoned.epochMilliseconds);
}

export const UTC_TIMEZONE: string = "Etc/UTC";

interface LocalizeDateTimeParams {
  /// The locale to localize in.
  locale: string;
  /// Whether to include the date (defaults to true).
  includeDate?: boolean;
  /// If including the date, whether to include the day (defaults to true).
  includeDay?: boolean;
  /// If including the date, whether to include the day of week (defaults to false).
  includeDayOfWeek?: boolean;
  /// Whether to include the time (defaults to true).
  includeTime?: boolean;
  /// If including the time, whether to include seconds (defaults to false).
  includeSeconds?: boolean;
  /// Whether to abbreviate days of the week and month names (defaults to false).
  abbreviate?: boolean;
  /// Whether to uppercase the first letter (defaults to false). Set this only when
  /// the date stands alone (not interpolated into a larger sentence) so it reads
  /// like the start of a sentence. Day/month names are never otherwise capitalized.
  capitalize?: boolean;
}

/// Localizes a date and time, optionally with the day of the week.
export function localizeDateTime(
  date: Temporal.PlainDateTime,
  args: LocalizeDateTimeParams,
): string {
  const format = getIntlDateTimeFormatUTC(args);
  const formatted = format.format(toUTCDate(date));
  return args.capitalize
    ? capitalizeFirstLetter(formatted, args.locale)
    : formatted;
}

/// Localizes only the year and month of a date.
export function localizeYearMonth(
  date: Temporal.PlainDate,
  args: {
    locale: string;
    abbreviate?: boolean;
    capitalize?: boolean;
  },
): string {
  return localizeDateTime(date.toPlainDateTime(), {
    locale: args.locale,
    abbreviate: args.abbreviate,
    capitalize: args.capitalize,
    includeDay: false,
    includeTime: false,
  });
}

/// Localizes a range of date and times as a string.
export function localizeDateTimeRange(
  start: Temporal.PlainDateTime,
  end: Temporal.PlainDateTime,
  args: LocalizeDateTimeParams,
): string {
  const format = getIntlDateTimeFormatUTC(args);
  const formatted = format.formatRange(toUTCDate(start), toUTCDate(end));
  return args.capitalize
    ? capitalizeFirstLetter(formatted, args.locale)
    : formatted;
}

// Creating Intl.DateTimeFormat every time is 40x slower.
const intlDateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

/// Gets an Intl.DateTimeFormat based on params.
function getIntlDateTimeFormatUTC(
  args: LocalizeDateTimeParams,
): Intl.DateTimeFormat {
  // We can't use args as the Map key as it uses reference equality.
  // Convert it to a json string. The Symbol type requires special handling.
  const cacheKey = JSON.stringify(args, (_, v) =>
    typeof v === "symbol" ? v.toString() : v,
  );
  const cached = intlDateTimeFormatCache.get(cacheKey);
  if (cached) return cached;

  const format = createIntlDateTimeFormatUTC(args);
  intlDateTimeFormatCache.set(cacheKey, format);
  return format;
}

/// Creates a new Intl.DateTimeFormat object based on params.
function createIntlDateTimeFormatUTC(
  args: LocalizeDateTimeParams,
): Intl.DateTimeFormat {
  const options: Intl.DateTimeFormatOptions = {};
  if (args.includeDate !== false) {
    options.year = "numeric";
    options.month = args.abbreviate ? "short" : "long";
    if (args.includeDay !== false) {
      options.day = "numeric";
    }
    if (args.includeDayOfWeek) {
      options.weekday = args.abbreviate ? "short" : "long";
    }
  }
  if (args.includeTime !== false) {
    options.hour = "numeric";
    options.minute = "numeric";
    if (args.includeSeconds) {
      options.second = "numeric";
    }
  }
  options.timeZone = "Etc/UTC";
  return Intl.DateTimeFormat(args.locale, options);
}

/// Localizes just the abbreviated month name of a date (e.g. "Jan", "Mai" in German).
export function localizeMonthAbbreviation(
  date: Temporal.PlainDate,
  args: {
    locale: string;
    capitalize?: boolean;
  },
): string {
  const cacheKey = JSON.stringify(args, (_, v) =>
    typeof v === "symbol" ? v.toString() : v,
  );
  let format = intlDateTimeFormatCache.get(cacheKey);
  if (!format) {
    const options: Intl.DateTimeFormatOptions = { month: "short" };
    options.timeZone = "Etc/UTC";
    format = Intl.DateTimeFormat(args.locale, options);
    intlDateTimeFormatCache.set(cacheKey, format);
  }
  const formatted = format.format(toUTCDate(date));
  return args.capitalize
    ? capitalizeFirstLetter(formatted, args.locale)
    : formatted;
}

const isoMuiDateFormat = "YYYY-MM-DD";

/// Gets the date format for a locale using Material UI placeholders.
export function getMuiDateFormat(locale: string): string {
  if (Intl.DateTimeFormat.supportedLocalesOf(locale).length === 0) {
    return isoMuiDateFormat;
  }

  // Format dummy 3333-11-22 date to figure out how it gets laid out.
  const referenceDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(3333, 10, 22));

  const format = referenceDate
    .replace("3333", "YYYY")
    .replace("33", "YY")
    .replace("11", "MM")
    .replace("22", "DD");

  // Sanity check: There should be no digits left
  if (/[0-9]/.test(format)) return isoMuiDateFormat;
  return format;
}

const defaultMuiTimeFormat = "HH:mm";

/// Gets a localized time format string compatible with Material UI time pickers.
export function getMuiTimeFormat(locale: string): string {
  if (Intl.DateTimeFormat.supportedLocalesOf(locale).length === 0) {
    return defaultMuiTimeFormat;
  }

  const intlFormat = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "numeric",
    hour12: undefined,
  });

  // Sniff the format using example dates.
  // Assume formats only vary by hour-minute separator, 12h vs 24h, and leading zeroes.
  const hourMinuteSeparatorMatch = /10(\W+)10/.exec(
    intlFormat.format(new Date(1970, 0, 1, 10, 10)),
  );
  const hourMinuteSeparator = hourMinuteSeparatorMatch
    ? hourMinuteSeparatorMatch[1]
    : ":";
  const uses24h = intlFormat.format(new Date(1970, 0, 1, 23, 0)).includes("23");
  const usesLeadingZeroes = intlFormat
    .format(new Date(1970, 0, 1, 3, 0))
    .includes("03");

  let format = "";
  if (uses24h) {
    format += usesLeadingZeroes ? "HH" : "H";
  } else {
    format += usesLeadingZeroes ? "hh" : "h";
  }
  format += hourMinuteSeparator;
  format += "mm";
  if (!uses24h) {
    format += " a";
  }
  return format;
}

/// Converts a protobuf Timestamp to a Temporal.Instant value (timezone-agnostic).
export function timestampToInstant(
  timestamp: Timestamp.AsObject,
): Temporal.Instant {
  // By protobuf, seconds and nanos should be integers.
  // Just in case, drop decimals otherwise BigInt will blow up.
  const nanos =
    BigInt(Math.floor(timestamp.nanos)) +
    BigInt(Math.floor(timestamp.seconds)) * 1_000_000_000n;
  return new Temporal.Instant(nanos);
}

/// Converts a Temporal Instant to a PlainDateTime in the browser's timezone.
export function instantToPlainDateTime(
  instant: Temporal.Instant,
  timezone?: string,
): Temporal.PlainDateTime {
  return instant
    .toZonedDateTimeISO(timezone ?? Temporal.Now.timeZoneId())
    .toPlainDateTime();
}

/// Converts a protobuf Timestamp to a PlainDateTime in the browser's timezone.
export function timestampToPlainDateTime(
  timestamp: Timestamp.AsObject,
  timezone?: string,
): Temporal.PlainDateTime {
  return instantToPlainDateTime(timestampToInstant(timestamp), timezone);
}

function timestamp2Date(timestamp: Timestamp.AsObject): Date {
  return new Date(Math.floor(timestamp.seconds * 1e3 + timestamp.nanos / 1e6));
}

/// Localizes a number of days as a relative time string (e.g. "today", "tomorrow", "in 3 days").
export function localizeRelativeDays(days: number, locale: string): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    days,
    "day",
  );
}

export { numNights, timestamp2Date };
