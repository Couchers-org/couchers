// format a date
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

import daysjs, { Dayjs } from "./dayjs";
import { dayMillis } from "./timeAgo";
import dayjs, { DayjsTimezone } from "dayjs";

const numNights = (date1: string, date2: string) => {
  const diffTime = Date.parse(date1) - Date.parse(date2);
  const diffDays = Math.ceil(diffTime / dayMillis);
  return diffDays;
};

/// Explicitly identifies the browser's timezone (clearer than "undefined").
export const BROWSER_TIMEZONE: unique symbol = Symbol("browser-timezone");
export const UTC_TIMEZONE: string = "Etc/UTC";

interface LocalizeDateTimeParams {
  /// The timezone to be used to figure the date components.
  /// This is a required parameter to avoid unexpected results.
  timezone: string | typeof BROWSER_TIMEZONE;
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
}

/// Localizes a date and time, optionally with the day of the week.
export function localizeDateTime(
  date: Date | Dayjs,
  args: LocalizeDateTimeParams,
): string {
  if (daysjs.isDayjs(date)) {
    date = date.toDate();
  }
  const format = getIntlDateTimeFormat(args);
  return format.format(date);
}

/// Localizes only the year and month of a date.
export function localizeYearMonth(
  date: Date | Dayjs,
  args: {
    timezone?: string | typeof BROWSER_TIMEZONE;
    locale: string;
    abbreviate?: boolean;
  },
): string {
  return localizeDateTime(date, {
    timezone: args.timezone ?? BROWSER_TIMEZONE,
    locale: args.locale,
    abbreviate: args.abbreviate,
    includeDay: false,
    includeTime: false,
  });
}

/// Localizes a range of date and times as a string.
export function localizeDateTimeRange(
  start: Date | Dayjs,
  end: Date | Dayjs,
  args: LocalizeDateTimeParams,
): string {
  if (daysjs.isDayjs(start)) {
    start = start.toDate();
  }
  if (daysjs.isDayjs(end)) {
    end = end.toDate();
  }
  const format = getIntlDateTimeFormat(args);
  return format.formatRange(start, end);
}

/// gets in an Intl.DateTimeFormat based on params.
function getIntlDateTimeFormat(
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
  if (args.timezone !== BROWSER_TIMEZONE) {
    options.timeZone = args.timezone;
  }
  return Intl.DateTimeFormat(args.locale, options);
}

function timestamp2Date(timestamp: Timestamp.AsObject): Date {
  return new Date(Math.floor(timestamp.seconds * 1e3 + timestamp.nanos / 1e6));
}

function isSameDate(date1: Dayjs, date2: Dayjs): boolean {
  return (
    date1.month() === date2.month() &&
    date1.year() === date2.year() &&
    date1.date() === date2.date()
  );
}

/** Compares whether date1 is equal to or in the future of date2 */
function isSameOrFutureDate(date1: Dayjs, date2: Dayjs): boolean {
  return isSameDate(date1, date2) || date1.isAfter(date2);
}

export { isSameOrFutureDate, numNights, timestamp2Date };
