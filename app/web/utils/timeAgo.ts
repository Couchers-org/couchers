import { TFunction } from "i18next";

export const secondMillis = 1000;
export const minuteMillis = 60 * secondMillis;
export const hourMillis = 60 * minuteMillis;
export const dayMillis = 24 * hourMillis;
export const weekMillis = 7 * dayMillis;
export const monthMillis = 30 * dayMillis;
export const yearMillis = 365 * dayMillis + 6 * hourMillis; // 365.25;

export enum TimeUnit {
  Seconds,
  Minutes,
  Hours,
  Days,
  Weeks,
  Months,
  Years,
}

/// A time span represented in human-friendly units, e.g. "5 days".
export class FriendlyTimeSpan {
  constructor(
    public value: number,
    public unit: TimeUnit,
  ) {}

  static fromMillis(value: number): FriendlyTimeSpan {
    if (value < minuteMillis) {
      return new FriendlyTimeSpan(Math.floor(value / 1000), TimeUnit.Seconds);
    }
    if (value < hourMillis) {
      return new FriendlyTimeSpan(
        Math.floor(value / minuteMillis),
        TimeUnit.Minutes,
      );
    }
    if (value < dayMillis) {
      return new FriendlyTimeSpan(
        Math.floor(value / hourMillis),
        TimeUnit.Hours,
      );
    }
    if (value < weekMillis) {
      return new FriendlyTimeSpan(Math.floor(value / dayMillis), TimeUnit.Days);
    }
    if (value < monthMillis) {
      return new FriendlyTimeSpan(
        Math.floor(value / weekMillis),
        TimeUnit.Weeks,
      );
    }
    if (value < yearMillis) {
      return new FriendlyTimeSpan(
        Math.floor(value / monthMillis),
        TimeUnit.Months,
      );
    }
    return new FriendlyTimeSpan(Math.floor(value / yearMillis), TimeUnit.Years);
  }

  static between(start: Date, end: Date): FriendlyTimeSpan {
    const diffMillis = end.getTime() - start.getTime();
    return FriendlyTimeSpan.fromMillis(diffMillis);
  }

  static since(date: Date): FriendlyTimeSpan {
    return this.between(date, new Date());
  }

  toLocalizedAgoText(locale: string): string {
    const relativeTime = new Intl.RelativeTimeFormat(locale, {
      style: "long", // 1 minute ago vs 1 min. ago
      numeric: "auto", // yesterday vs 1 day ago
    });
    switch (this.unit) {
      case TimeUnit.Seconds:
        return relativeTime.format(this.value, "second");
      case TimeUnit.Minutes:
        return relativeTime.format(this.value, "minute");
      case TimeUnit.Hours:
        return relativeTime.format(this.value, "hour");
      case TimeUnit.Days:
        return relativeTime.format(this.value, "day");
      case TimeUnit.Weeks:
        return relativeTime.format(this.value, "week");
      case TimeUnit.Months:
        return relativeTime.format(this.value, "month");
      case TimeUnit.Years:
        return relativeTime.format(this.value, "year");
    }
  }
}

export function timeAgo({
  since,
  t,
  locale,
  minimumUnit = TimeUnit.Seconds,
}: {
  since: Date;
  t: TFunction<"global", undefined>;
  locale: string;
  minimumUnit?: TimeUnit;
}): string {
  const diffMillis = Date.now() - since.getTime();

  const timeSpan = FriendlyTimeSpan.fromMillis(diffMillis);
  if (minimumUnit && timeSpan.unit < minimumUnit) {
    if (minimumUnit == TimeUnit.Minutes)
      return t("global:less_than_a_minute_ago");
    if (minimumUnit == TimeUnit.Hours)
      return t("global:less_than_one_hour_ago");
  }

  return timeSpan.toLocalizedAgoText(locale);
}
