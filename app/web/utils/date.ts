// format a date
import { Duration as DurationPb } from "google-protobuf/google/protobuf/duration_pb";

import { Dayjs, Duration } from "./dayjs";
import { DAY_MILLIS } from "./timeAgo";

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
  const diffDays = Math.ceil(diffTime / DAY_MILLIS);
  return diffDays;
};

const duration2pb = (duration: Duration) => {
  const d = new DurationPb();
  d.setSeconds(duration.asSeconds());
  d.setNanos(duration.milliseconds() * 1000);
  return d;
};

const isSameDate = (date1: Dayjs, date2: Dayjs): boolean => {
  return (
    date1.month() === date2.month() &&
    date1.year() === date2.year() &&
    date1.date() === date2.date()
  );
};

/** Compares whether date1 is equal to or in the future of date2 */
const isSameOrFutureDate = (date1: Dayjs, date2: Dayjs): boolean => {
  return isSameDate(date1, date2) || date1.isAfter(date2);
};

export {
  dateFormatter,
  dateTimeFormatter,
  duration2pb,
  isSameOrFutureDate,
  monthFormatter,
  numNights,
};
