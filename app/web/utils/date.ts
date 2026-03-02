// format a date
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

import daysjs, { Dayjs } from "./dayjs";
import { dayMillis } from "./timeAgo";

const monthFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  });

const numNights = (date1: string, date2: string) => {
  const diffTime = Date.parse(date1) - Date.parse(date2);
  const diffDays = Math.ceil(diffTime / dayMillis);
  return diffDays;
};

/// Localizes a date, optionally with a time and day of week.
function localizeDate(
  date: Date | Dayjs,
  locale: string,
  options: {
    includeDayOfWeek?: boolean;
    includeTime?: boolean;
    includeSeconds?: boolean;
    long?: boolean;
  } = {},
): string {
  const intlOptions: Intl.DateTimeFormatOptions = {};
  fillDateOptions(intlOptions, options);
  if (options.includeTime) {
    fillTimeOptions(intlOptions, options);
  }
  if (daysjs.isDayjs(date)) {
    intlOptions.timeZone = getDayjsTimezone(date);
    date = date.toDate();
  }
  const format = Intl.DateTimeFormat(locale, intlOptions);
  return format.format(date);
}

/// Localizes only the time component of a date.
function localizeTime(
  time: Date | Dayjs,
  locale: string,
  options: {
    includeSeconds?: boolean;
  } = {},
): string {
  const intlOptions: Intl.DateTimeFormatOptions = {};
  fillTimeOptions(intlOptions, options);
  if (daysjs.isDayjs(time)) {
    intlOptions.timeZone = getDayjsTimezone(time);
    time = time.toDate();
  }
  const format = Intl.DateTimeFormat(locale, intlOptions);
  return format.format(time);
}

/// Localizes a range of dates as a string.
function localizeDateRange(
  start: Date | Dayjs,
  end: Date | Dayjs,
  locale: string,
  options: {
    includeDayOfWeek?: boolean;
    includeTime?: boolean;
    includeSeconds?: boolean;
    long?: boolean;
  } = {},
): string {
  const intlOptions: Intl.DateTimeFormatOptions = {};
  fillDateOptions(intlOptions, options);
  if (options.includeTime) {
    fillTimeOptions(intlOptions, options);
  }
  if (daysjs.isDayjs(start)) {
    intlOptions.timeZone = getDayjsTimezone(start);
    start = start.toDate();
  }
  if (daysjs.isDayjs(end)) {
    end = end.toDate();
  }
  const format = Intl.DateTimeFormat(locale, intlOptions);
  return format.formatRange(start, end);
}

/// Fills in an Intl.DateTimeFormatOptions date-related properties.
function fillDateOptions(
  options: Intl.DateTimeFormatOptions,
  args: {
    includeDayOfWeek?: boolean;
    long?: boolean;
  },
) {
  options.year = "numeric";
  options.month = args.long ? "long" : "short";
  options.day = "numeric";
  if (args.includeDayOfWeek) {
    options.weekday = args.long ? "long" : "short";
  }
}

/// Fills in an Intl.DateTimeFormatOptions time-related properties.
function fillTimeOptions(
  options: Intl.DateTimeFormatOptions,
  args: {
    includeSeconds?: boolean;
  },
) {
  options.hour = "numeric";
  options.minute = "numeric";
  if (args.includeSeconds) {
    options.second = "numeric";
  }
}

function timestamp2Date(timestamp: Timestamp.AsObject): Date {
  return new Date(Math.floor(timestamp.seconds * 1e3 + timestamp.nanos / 1e6));
}

function getDayjsTimezone(date: Dayjs): string | undefined {
  // There is no API to get the value, but the state exists and impacts formatting.
  return (date as any)?.$x?.$timezone; // eslint-disable-line @typescript-eslint/no-explicit-any
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

export {
  isSameOrFutureDate,
  localizeDate,
  localizeDateRange,
  localizeTime,
  monthFormatter,
  numNights,
  timestamp2Date,
};
