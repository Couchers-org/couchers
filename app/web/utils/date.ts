// format a date
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { TFunction } from "i18next";

import daysjs, { Dayjs } from "./dayjs";
import { dayMillis } from "./timeAgo";

const monthFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  });

const dateTimeFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  });

const dateFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
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
  const intlOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: options.long ? "long" : "short",
    day: "numeric",
  };
  if (options.includeDayOfWeek) {
    intlOptions.weekday = options.long ? "long" : "short";
  }
  if (options.includeTime) {
    intlOptions.hour = "numeric";
    intlOptions.minute = "numeric";
    if (options.includeSeconds) {
      intlOptions.second = "numeric";
    }
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
  const intlOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
  };
  if (options.includeSeconds) {
    intlOptions.second = "numeric";
  }
  if (daysjs.isDayjs(time)) {
    intlOptions.timeZone = getDayjsTimezone(time);
    time = time.toDate();
  }
  const format = Intl.DateTimeFormat(locale, intlOptions);
  return format.format(time);
}

/// Localizes a range of dates as a string.
function localizeDateTimeRange(
  start: Dayjs,
  end: Dayjs,
  locale: string,
  t: TFunction,
  options: {
    includeDayOfWeek?: boolean;
    includeSeconds?: boolean;
    long?: boolean;
  } = {},
): string {
  if (isSameDate(start, end)) {
    const stringKey =
      "global:datetime_formats.datetime_range_sameday_" +
      (options.long ? "long" : "short");
    return t(stringKey, {
      date: localizeDate(start, locale, {
        includeDayOfWeek: options.includeDayOfWeek,
        includeTime: false,
        long: options.long,
      }),
      startTime: localizeTime(start, locale),
      endTime: localizeTime(end, locale),
    });
  } else {
    const stringKey =
      "global:datetime_formats.datetime_range_multiday_" +
      (options.long ? "long" : "short");
    return t(stringKey, {
      startDateTime: localizeDate(start, locale, {
        includeDayOfWeek: options.includeDayOfWeek,
        includeTime: true,
        long: options.long,
      }),
      endDateTime: localizeDate(end, locale, {
        includeDayOfWeek: options.includeDayOfWeek,
        includeTime: true,
        long: options.long,
      }),
    });
  }
}

function timestamp2Date(timestamp: Timestamp.AsObject): Date {
  return new Date(Math.floor(timestamp.seconds * 1e3 + timestamp.nanos / 1e6));
}

function getDayjsTimezone(date: Dayjs): string | undefined {
  // There is no API to get the value, but the state exists and impacts formatting.
  return (date as any)?.$x?.timezone; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  dateFormatter,
  dateTimeFormatter,
  isSameOrFutureDate,
  localizeDate,
  localizeDateTimeRange,
  localizeTime,
  monthFormatter,
  numNights,
  timestamp2Date,
};
