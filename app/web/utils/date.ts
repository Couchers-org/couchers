// format a date
import { Duration as DurationPb } from "google-protobuf/google/protobuf/duration_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { TFunction } from "i18next";
import { Temporal } from "temporal-polyfill";
import dayjs, { i18nToDayjsLocale } from "utils/dayjs";

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

/// Computes the number of days/nights between two dates.
/// E.g. there's one day/night between 2020-01-01 and 2020-01-02.
export function daysBetween(
  date1: Temporal.PlainDate,
  date2: Temporal.PlainDate,
): number {
  return date1.until(date2, { largestUnit: "days" }).days;
}

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
  date: Temporal.PlainDateTime | Temporal.PlainDate,
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
  start: Temporal.PlainDateTime | Temporal.PlainDate,
  end: Temporal.PlainDateTime | Temporal.PlainDate,
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

const timeZoneNameCache = new Map<string, string>();

/// Localizes the name of a time zone.
export function localizeTimeZone(
  timeZone: string,
  locale: string,
  options?: {
    short?: boolean;
    capitalize?: boolean;
  },
) {
  const intlOptions: Intl.DateTimeFormatOptions = {
    timeZone: timeZone,
    timeZoneName: options?.short ? "short" : "long",
  };
  const cacheKey = JSON.stringify({ ...intlOptions, locale });
  let name = timeZoneNameCache.get(cacheKey);
  if (!name) {
    const format = new Intl.DateTimeFormat(locale, intlOptions);
    name = format
      .formatToParts(Date.now())
      .find((part) => part.type === "timeZoneName")!.value;
    timeZoneNameCache.set(cacheKey, name);
  }
  return options?.capitalize ? capitalizeFirstLetter(name, locale) : name;
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

const APPROX_DAYS_PER_YEAR = 365;
const APPROX_DAYS_PER_MONTH = 30;

/// Converts a duration which might have date units,
/// to an approximate equivalent which only has time units.
/// E.g. if the user asks to snooze something for 1 month (non-specific duration),
/// we need to convert that to an amount of time by approximating hours/month.
export function approxTimeDuration(
  duration: Temporal.Duration,
): Temporal.Duration {
  if (duration.years != 0) {
    duration = duration.with({
      years: 0,
      days: duration.days + duration.years * APPROX_DAYS_PER_YEAR,
    });
  }
  if (duration.months != 0) {
    duration = duration.with({
      months: 0,
      days: duration.days + duration.months * APPROX_DAYS_PER_MONTH,
    });
  }
  if (duration.weeks != 0) {
    duration = duration.with({
      weeks: 0,
      days: duration.days + duration.weeks * 7,
    });
  }
  if (duration.days != 0) {
    duration = duration.with({
      days: 0,
      hours: duration.hours + duration.days * 24,
    });
  }
  return duration;
}

/// Converts a duration which might have time and date units,
/// to an approximate equivalent that uses date units.
export function approxDateDuration(
  duration: Temporal.Duration,
): Temporal.Duration {
  duration = approxTimeDuration(duration); // Remove date units
  // Spreads 90 seconds -> 1 minute + 30 seconds, etc. for time units
  duration = duration.round({ largestUnit: "hours" });

  // Approximate date units above 24 hours.
  if (duration.hours >= 24 || duration.hours <= -24) {
    // Manipulate the absolute value for modulo operations
    const isPositive = duration.sign >= 0;
    duration = duration.abs();

    duration = duration.with({
      days: Math.floor(duration.hours / 24),
      hours: duration.hours % 24,
    });

    if (duration.days >= APPROX_DAYS_PER_YEAR) {
      duration = duration.with({
        years: Math.floor(duration.days / APPROX_DAYS_PER_YEAR),
        days: duration.days % APPROX_DAYS_PER_YEAR,
      });
    }
    if (duration.days >= APPROX_DAYS_PER_MONTH) {
      duration = duration.with({
        months: Math.floor(duration.days / APPROX_DAYS_PER_MONTH),
        days: duration.days % APPROX_DAYS_PER_MONTH,
      });
    }
    if (duration.days >= 7) {
      duration = duration.with({
        weeks: Math.floor(duration.days / 7),
        days: duration.days % 7,
      });
    }

    if (!isPositive) duration = duration.negated();
  }

  return duration;
}

export function durationToProtobuf(duration: Temporal.Duration): DurationPb {
  const pb = new DurationPb();
  pb.setSeconds(Math.floor(duration.total("seconds")));
  pb.setNanos(duration.milliseconds * 1000 + duration.nanoseconds);
  return pb;
}

export interface LocalizeRelativeTimeOptions {
  style?: Intl.RelativeTimeFormatStyle;
  /// We override the default to "auto"
  numeric?: Intl.RelativeTimeFormatNumeric;
  /// If true, capitalize if the script supports it. By default uses running text capitalization.
  capitalize?: boolean;
}

// Creating Intl objects every time is slow, so cache them.
const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>();

/// Localizes a time offset expressed in a given unit, e.g. "in 4 minutes".
export function localizeRelativeTimeUnit(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string,
  options?: LocalizeRelativeTimeOptions,
): string {
  const intlOptions = {
    style: options?.style ?? "long",
    numeric: options?.numeric ?? "auto",
  };
  const cacheKey = JSON.stringify({ locale, ...intlOptions });
  let formatter = relativeTimeFormatCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, intlOptions);
    relativeTimeFormatCache.set(cacheKey, formatter);
  }
  let result = formatter.format(value, unit);
  if (options?.capitalize === true)
    result = capitalizeFirstLetter(result, locale);
  return result;
}

/// Localizes a time offset (positive or negative),
/// expressing it in the largest possible unit,
/// e.g. "in 4 days" for a duration of 4 days and 3 minutes.
export function localizeTimeOffset(
  duration: Temporal.Duration,
  locale: string,
  options?: LocalizeRelativeTimeOptions & {
    smallestUnit?: Temporal.PluralizeUnit<Temporal.TimeUnit>;
    t?: TFunction<"global", undefined>;
  },
) {
  duration = approxDateDuration(duration);

  if (duration.years != 0)
    return localizeRelativeTimeUnit(duration.years, "years", locale, options);
  if (duration.months != 0)
    return localizeRelativeTimeUnit(duration.months, "months", locale, options);
  if (duration.weeks != 0)
    return localizeRelativeTimeUnit(duration.weeks, "weeks", locale, options);
  if (duration.days != 0)
    return localizeRelativeTimeUnit(duration.days, "days", locale, options);

  // Support "less than one hour ago"
  if (
    duration.hours != 0 ||
    options?.smallestUnit == "hour" ||
    options?.smallestUnit == "hours"
  ) {
    if (duration.hours == 0 && duration.sign <= 0 && options?.t)
      return options.t("global:relative_time.less_than_one_hour_ago");
    return localizeRelativeTimeUnit(duration.hours, "hours", locale, options);
  }

  // Support "less than one minute ago"
  if (
    duration.minutes != 0 ||
    options?.smallestUnit == "minute" ||
    options?.smallestUnit == "minutes"
  ) {
    if (duration.minutes == 0 && duration.sign <= 0 && options?.t)
      return options.t("global:relative_time.less_than_a_minute_ago");
    return localizeRelativeTimeUnit(
      duration.minutes,
      "minutes",
      locale,
      options,
    );
  }

  return localizeRelativeTimeUnit(duration.seconds, "seconds", locale, options);
}

/// Localizes a point in time as a duration relative to some other point in time (by default, now).
export function localizeRelativeTime(
  instant: Temporal.Instant | Timestamp.AsObject,
  locale: string,
  options?: LocalizeRelativeTimeOptions & {
    relativeTo?: Temporal.Instant;
    smallestUnit?: Temporal.PluralizeUnit<Temporal.TimeUnit>;
    t?: TFunction<"global", undefined>;
  },
) {
  if (!(instant instanceof Temporal.Instant)) {
    instant = timestampToInstant(instant);
  }

  const duration = instant.since(options?.relativeTo ?? Temporal.Now.instant());
  return localizeTimeOffset(duration, locale, options);
}

/// Localizes a duration (amount of time), expressing it in the largest possible unit,
/// e.g. "4 days" for a duration of 4 days and 3 minutes. (no "in " prefix)
export function localizeDuration(duration: Temporal.Duration, locale: string) {
  duration = approxDateDuration(duration);

  // Intl.RelativeTimeFormat only supports formatting "in 4 days" / "4 days ago", not "4 days"
  // so we have to depend on dayjs.
  let dayjsDuration;
  if (duration.years > 0)
    dayjsDuration = dayjs.duration(duration.years, "years");
  else if (duration.months > 0)
    dayjsDuration = dayjs.duration(duration.months, "months");
  else if (duration.weeks > 0)
    dayjsDuration = dayjs.duration(duration.weeks, "weeks");
  else if (duration.days > 0)
    dayjsDuration = dayjs.duration(duration.days, "days");
  else if (duration.hours > 0)
    dayjsDuration = dayjs.duration(duration.hours, "hours");
  else if (duration.minutes > 0)
    dayjsDuration = dayjs.duration(duration.minutes, "minutes");
  else dayjsDuration = dayjs.duration(duration.seconds, "seconds");

  return dayjsDuration.locale(i18nToDayjsLocale(locale)).humanize();
}
