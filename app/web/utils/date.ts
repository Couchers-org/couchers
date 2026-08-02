import { Duration as DurationPb } from "google-protobuf/google/protobuf/duration_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { Temporal } from "temporal-polyfill";

/// Computes the number of days/nights between two dates.
/// E.g. there's one day/night between 2020-01-01 and 2020-01-02.
export function daysBetween(date1: Temporal.PlainDate, date2: Temporal.PlainDate): number {
  return date1.until(date2, { largestUnit: "days" }).days;
}

/// Converts a protobuf Timestamp to a Temporal.Instant value (timezone-agnostic).
export function timestampToInstant(timestamp: Timestamp.AsObject): Temporal.Instant {
  // By protobuf, seconds and nanos should be integers.
  // Just in case, drop decimals otherwise BigInt will blow up.
  const nanos = BigInt(Math.floor(timestamp.nanos)) + BigInt(Math.floor(timestamp.seconds)) * 1_000_000_000n;
  return new Temporal.Instant(nanos);
}

/// Converts a Temporal Instant to a PlainDateTime in the browser's timezone.
export function instantToPlainDateTime(instant: Temporal.Instant, timezone?: string): Temporal.PlainDateTime {
  return instant.toZonedDateTimeISO(timezone ?? Temporal.Now.timeZoneId()).toPlainDateTime();
}

/// Converts a protobuf Timestamp to a PlainDateTime in the browser's timezone.
export function timestampToPlainDateTime(timestamp: Timestamp.AsObject, timezone?: string): Temporal.PlainDateTime {
  return instantToPlainDateTime(timestampToInstant(timestamp), timezone);
}

export function timestampToZonedDateTime(
  timestamp: Timestamp.AsObject,
  timezone: string | undefined,
): Temporal.ZonedDateTime {
  return timestampToInstant(timestamp).toZonedDateTimeISO(timezone ?? Temporal.Now.timeZoneId());
}

const APPROX_DAYS_PER_YEAR = 365;
const APPROX_DAYS_PER_MONTH = 30;

/// Converts a duration which might have date units,
/// to an approximate equivalent which only has time units.
/// E.g. if the user asks to snooze something for 1 month (non-specific duration),
/// we need to convert that to an amount of time by approximating hours/month.
export function approxTimeDuration(duration: Temporal.Duration): Temporal.Duration {
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
export function approxDateDuration(duration: Temporal.Duration): Temporal.Duration {
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
