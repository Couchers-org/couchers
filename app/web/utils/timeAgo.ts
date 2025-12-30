import { TFunction } from "i18next";

export const secondMillis = 1000;
export const minuteMillis = 60 * secondMillis;
export const hourMillis = 60 * minuteMillis;
export const dayMillis = 24 * hourMillis;
export const weekMillis = 7 * dayMillis;
export const monthMillis = 30 * dayMillis;
export const yearMillis = 365 * dayMillis + 6 * hourMillis; // 365.25;

interface FuzzySpecT {
  millis: number;
  translationKey: Parameters<TFunction<"global", undefined>>[0];
}

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

  toLocalizedAgoText(t: TFunction<"global", undefined>): string {
    switch (this.unit) {
      case TimeUnit.Seconds:
        return t("relative_time.less_than_a_minute_ago");
      case TimeUnit.Minutes:
        return t("relative_time.n_minutes_ago", { count: this.value });
      case TimeUnit.Hours:
        return t("relative_time.n_hours_ago", { count: this.value });
      case TimeUnit.Days:
        return t("relative_time.n_days_ago", { count: this.value });
      case TimeUnit.Weeks:
        return t("relative_time.n_weeks_ago", { count: this.value });
      case TimeUnit.Months:
        return t("relative_time.n_months_ago", { count: this.value });
      case TimeUnit.Years:
        return t("relative_time.n_years_ago", { count: this.value });
    }
  }
}

export function timeAgoI18n({
  input,
  t,
  fuzzy = undefined,
}: {
  input: Date | string;
  t: TFunction<"global", undefined>;
  fuzzy?: FuzzySpecT;
}) {
  if (input === undefined) return "";
  const date = new Date(input);
  const diffMillis = Date.now() - date.getTime();

  if (fuzzy && diffMillis < fuzzy.millis) {
    // if fuzzyMillis and fuzzyText are both set, then for times less than fuzzyMillis, we return fuzzyText
    return t(fuzzy.translationKey) as string;
  }

  return FriendlyTimeSpan.fromMillis(diffMillis).toLocalizedAgoText(t);
}
