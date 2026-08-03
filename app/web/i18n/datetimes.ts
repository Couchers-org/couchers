// format a date
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { capitalizeFirstLetter } from "i18n/casing";
import { TFunction } from "i18next";
import { Temporal } from "temporal-polyfill";
import { approxDateDuration, timestampToInstant, UTC_TIMEZONE } from "utils/date";
import dayjs, { i18nToDayjsLocale } from "utils/dayjs";

/**
 * Converts a Temporal date/time object to a Date
 * such that it displays as expected in the UTC timezone.
 */
function toDateForUTCDisplay(temporal: Temporal.ZonedDateTime | Temporal.PlainDate | Temporal.PlainDateTime): Date {
  if (temporal instanceof Temporal.ZonedDateTime) {
    // Discard the timezone, we'll reinterpret it in UTC,
    // which results in an incorrect timestamp but correct
    // datetime components for displaying.
    temporal = temporal.toPlainDateTime();
  }
  if (temporal instanceof Temporal.PlainDate) {
    temporal = temporal.toPlainDateTime();
  }
  const zoned = temporal.toZonedDateTime(UTC_TIMEZONE);
  return new Date(zoned.epochMilliseconds);
}

interface LocalizeDateOptions {
  /**
   * Whether to include the year (defaults to true).
   * "auto" omits the year if it matches the current year (browser timezone).
   */
  includeYear?: boolean | "auto";
  /** Whether to include the day (defaults to true). */
  includeDay?: boolean;
  /** Whether to include the day of week (defaults to false). */
  includeDayOfWeek?: boolean;
  /** Whether to abbreviate days of the week and month names (defaults to false). */
  abbreviate?: boolean;
  /**
   * Whether to uppercase the first letter (defaults to false). Set this only when
   * the date stands alone (not interpolated into a larger sentence) so it reads
   * like the start of a sentence. Day/month names are never otherwise capitalized.
   */
  capitalize?: boolean;
}

interface LocalizeTimeOptions {
  /** Whether to include seconds (defaults to false). */
  includeSeconds?: boolean;
}
interface LocalizeDateTimeOptions extends LocalizeDateOptions, LocalizeTimeOptions {
  /** Whether to include the date (defaults to true). */
  includeDate?: boolean;
  /** Whether to include the time (defaults to true). */
  includeTime?: boolean;
}

/**
 * Localizes a date and time, in full or partially (specific components),
 * optionally with the day of the week and seconds.
 */
export function localizeDateTime(
  date: Temporal.PlainDateTime | Temporal.ZonedDateTime,
  locale: string,
  options?: LocalizeDateTimeOptions,
): string {
  const format = getIntlDateTimeFormatUTC(locale, options, { year: date.year });
  const formatted = format.format(toDateForUTCDisplay(date));
  return options?.capitalize ? capitalizeFirstLetter(formatted, locale) : formatted;
}

/** Localizes a date only (no time), optionally with the day of the week. */
export function localizeDateOnly(
  date: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  locale: string,
  options?: LocalizeDateOptions,
): string {
  if (date instanceof Temporal.PlainDate) {
    date = date.toPlainDateTime();
  }
  return localizeDateTime(date, locale, { ...options, includeTime: false });
}

/** Localizes a time only (no date), optionally with seconds. */
export function localizeTimeOnly(
  time: Temporal.PlainTime | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  locale: string,
  options?: LocalizeTimeOptions,
): string {
  if (time instanceof Temporal.PlainTime) {
    time = new Temporal.PlainDate(2000, 1, 1).toPlainDateTime(time);
  }
  return localizeDateTime(time, locale, { ...options, includeDate: false });
}

/** Localizes only the year and month of a date. */
export function localizeYearMonth(
  date: Temporal.PlainYearMonth | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  locale: string,
  options?: {
    abbreviate?: boolean; // Defaults to false
    capitalize?: boolean; // Defaults to false
  },
): string {
  if (date instanceof Temporal.PlainYearMonth) {
    date = date.toPlainDate({ day: 1 });
  }

  return localizeDateOnly(date, locale, {
    ...options,
    includeDay: false,
  });
}

/** Localizes the name of a month (e.g. "Januar", "Mai" in German). */
export function localizeMonthName(
  month: number | Temporal.PlainYearMonth | Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  locale: string,
  options?: {
    abbreviate?: boolean; // Defaults to false
    capitalize?: boolean; // Defaults to false
  },
): string {
  if (typeof month !== "number") {
    month = month.month;
  }
  const dummyDate = new Temporal.PlainDate(2000, month, 1);
  return localizeDateOnly(dummyDate, locale, {
    ...options,
    includeYear: false,
    includeDay: false,
  });
}

/** Localizes a range of date and times as a string. */
export function localizeDateTimeRange(
  start: Temporal.PlainDateTime | Temporal.ZonedDateTime,
  end: Temporal.PlainDateTime | Temporal.ZonedDateTime,
  locale: string,
  options?: LocalizeDateTimeOptions,
): string {
  const format = getIntlDateTimeFormatUTC(locale, options, {
    year: start.year == end.year ? start.year : undefined,
  });
  const formatted = format.formatRange(toDateForUTCDisplay(start), toDateForUTCDisplay(end));
  return options?.capitalize ? capitalizeFirstLetter(formatted, locale) : formatted;
}

/** Localizes a range of dates (no times) as a string. */
export function localizeDateRange(
  start: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  end: Temporal.PlainDate | Temporal.PlainDateTime | Temporal.ZonedDateTime,
  locale: string,
  options?: LocalizeDateOptions,
): string {
  if (start instanceof Temporal.PlainDate) {
    start = start.toPlainDateTime();
  }
  if (end instanceof Temporal.PlainDate) {
    end = end.toPlainDateTime();
  }
  return localizeDateTimeRange(start, end, locale, {
    ...options,
    includeTime: false,
  });
}

// Creating Intl.DateTimeFormat every time is 40x slower.
// Key: stringified (Intl.DateTimeFormatOptions & { locale: string })
const intlDateTimeFormatCache = new Map<string, Intl.DateTimeFormat>();

/** Gets an Intl.DateTimeFormat based on options. */
function getIntlDateTimeFormatUTC(
  locale: string,
  options?: LocalizeDateTimeOptions,
  dateComponents?: { year?: number },
): Intl.DateTimeFormat {
  const intlOptions = getIntlDateTimeFormatOptionsUTC(options, dateComponents);
  const cacheKey = JSON.stringify({ ...intlOptions, locale });
  let format = intlDateTimeFormatCache.get(cacheKey);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, intlOptions);
    intlDateTimeFormatCache.set(cacheKey, format);
  }
  return format;
}

/** Creates a new Intl.DateTimeFormat object based on params. */
function getIntlDateTimeFormatOptionsUTC(
  options?: LocalizeDateTimeOptions,
  dateComponents?: { year?: number },
): Intl.DateTimeFormatOptions {
  const intlOptions: Intl.DateTimeFormatOptions = {};
  if (options?.includeDate !== false) {
    if (options?.includeYear === undefined || options?.includeYear === true) {
      intlOptions.year = "numeric";
    } else if (
      options?.includeYear === "auto" &&
      dateComponents?.year !== undefined &&
      dateComponents.year != new Date().getFullYear()
    ) {
      intlOptions.year = "numeric";
    }

    intlOptions.month = options?.abbreviate ? "short" : "long";

    if (options?.includeDay !== false) {
      intlOptions.day = "numeric";
    }

    if (options?.includeDayOfWeek) {
      intlOptions.weekday = options.abbreviate ? "short" : "long";
    }
  }

  if (options?.includeTime !== false) {
    intlOptions.hour = "numeric";
    intlOptions.minute = "numeric";
    if (options?.includeSeconds) {
      intlOptions.second = "numeric";
    }
  }

  intlOptions.timeZone = UTC_TIMEZONE;
  return intlOptions;
}

const timeZoneNameCache = new Map<string, string>();

/** Localizes the name of a time zone. */
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
    name = format.formatToParts(Date.now()).find((part) => part.type === "timeZoneName")!.value;
    timeZoneNameCache.set(cacheKey, name);
  }
  return options?.capitalize ? capitalizeFirstLetter(name, locale) : name;
}

const isoMuiDateFormat = "YYYY-MM-DD";

/** Gets the date format for a locale using Material UI placeholders. */
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

  const format = referenceDate.replace("3333", "YYYY").replace("33", "YY").replace("11", "MM").replace("22", "DD");

  // Sanity check: There should be no digits left
  if (/[0-9]/.test(format)) return isoMuiDateFormat;
  return format;
}

const defaultMuiTimeFormat = "HH:mm";

/** Gets a localized time format string compatible with Material UI time pickers. */
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
  const hourMinuteSeparatorMatch = /10(\W+)10/.exec(intlFormat.format(new Date(1970, 0, 1, 10, 10)));
  const hourMinuteSeparator = hourMinuteSeparatorMatch ? hourMinuteSeparatorMatch[1] : ":";
  const uses24h = intlFormat.format(new Date(1970, 0, 1, 23, 0)).includes("23");
  const usesLeadingZeroes = intlFormat.format(new Date(1970, 0, 1, 3, 0)).includes("03");

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

export interface LocalizeRelativeTimeOptions {
  style?: Intl.RelativeTimeFormatStyle;
  /** We override the default to "auto" */
  numeric?: Intl.RelativeTimeFormatNumeric;
  /** If true, capitalize if the script supports it. By default uses running text capitalization. */
  capitalize?: boolean;
}

// Creating Intl objects every time is slow, so cache them.
const relativeTimeFormatCache = new Map<string, Intl.RelativeTimeFormat>();

/** Localizes a time offset expressed in a given unit, e.g. "in 4 minutes". */
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
  if (options?.capitalize === true) result = capitalizeFirstLetter(result, locale);
  return result;
}

/**
 * Localizes a time offset (positive or negative),
 * expressing it in the largest possible unit,
 * e.g. "in 4 days" for a duration of 4 days and 3 minutes.
 */
export function localizeTimeOffset(
  duration: Temporal.Duration,
  locale: string,
  options?: LocalizeRelativeTimeOptions & {
    smallestUnit?: Temporal.PluralizeUnit<Temporal.TimeUnit>;
    t?: TFunction<"global", undefined>;
  },
) {
  duration = approxDateDuration(duration);

  if (duration.years != 0) return localizeRelativeTimeUnit(duration.years, "years", locale, options);
  if (duration.months != 0) return localizeRelativeTimeUnit(duration.months, "months", locale, options);
  if (duration.weeks != 0) return localizeRelativeTimeUnit(duration.weeks, "weeks", locale, options);
  if (duration.days != 0) return localizeRelativeTimeUnit(duration.days, "days", locale, options);

  // Support "less than one hour ago"
  if (duration.hours != 0 || options?.smallestUnit == "hour" || options?.smallestUnit == "hours") {
    if (duration.hours == 0 && duration.sign <= 0 && options?.t)
      return options.t("global:relative_time.less_than_one_hour_ago");
    return localizeRelativeTimeUnit(duration.hours, "hours", locale, options);
  }

  // Support "less than one minute ago"
  if (duration.minutes != 0 || options?.smallestUnit == "minute" || options?.smallestUnit == "minutes") {
    if (duration.minutes == 0 && duration.sign <= 0 && options?.t)
      return options.t("global:relative_time.less_than_a_minute_ago");
    return localizeRelativeTimeUnit(duration.minutes, "minutes", locale, options);
  }

  return localizeRelativeTimeUnit(duration.seconds, "seconds", locale, options);
}

/** Localizes a point in time as a duration relative to some other point in time (by default, now). */
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

/**
 * Localizes a duration (amount of time), expressing it in the largest possible unit,
 * e.g. "4 days" for a duration of 4 days and 3 minutes. (no "in " prefix)
 */
export function localizeDuration(duration: Temporal.Duration, locale: string) {
  duration = approxDateDuration(duration);

  // Intl.RelativeTimeFormat only supports formatting "in 4 days" / "4 days ago", not "4 days"
  // so we have to depend on dayjs.
  let dayjsDuration;
  if (duration.years > 0) dayjsDuration = dayjs.duration(duration.years, "years");
  else if (duration.months > 0) dayjsDuration = dayjs.duration(duration.months, "months");
  else if (duration.weeks > 0) dayjsDuration = dayjs.duration(duration.weeks, "weeks");
  else if (duration.days > 0) dayjsDuration = dayjs.duration(duration.days, "days");
  else if (duration.hours > 0) dayjsDuration = dayjs.duration(duration.hours, "hours");
  else if (duration.minutes > 0) dayjsDuration = dayjs.duration(duration.minutes, "minutes");
  else dayjsDuration = dayjs.duration(duration.seconds, "seconds");

  return dayjsDuration.locale(i18nToDayjsLocale(locale)).humanize();
}
