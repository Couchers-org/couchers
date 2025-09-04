import { TFunction } from "i18next";

// TODO(FB) Consider using date-fns

export const MINUTE_MILLIS = 60000;
export const TWO_MINUTE_MILLIS = MINUTE_MILLIS * 2;
export const QUARTER_HOUR_MILLIS = MINUTE_MILLIS * 15;
export const HOUR_MILLIS = QUARTER_HOUR_MILLIS * 4;
export const TWO_HOUR_MILLIS = HOUR_MILLIS * 2;
export const DAY_MILLIS = HOUR_MILLIS * 24;
export const TWO_DAY_MILLIS = DAY_MILLIS * 2;
export const WEEK_MILLIS = DAY_MILLIS * 7;
export const TWO_WEEK_MILLIS = WEEK_MILLIS * 2;
export const MONTH_MILLIS = WEEK_MILLIS * 4;
export const TWO_MONTH_MILLIS = MONTH_MILLIS * 2;
export const YEAR_MILLIS = MONTH_MILLIS * 12;
export const TWO_YEAR_MILLIS = YEAR_MILLIS * 2;

export const LESS_THAN_HOUR = "Less than an hour ago";

export interface FuzzySpec {
  millis: number;
  text: string;
}

/**
 * @deprecated Use `timeAgoI18n` instead.
 */
export function timeAgo(input: Date | string, fuzzy?: FuzzySpec) {
  if (input === undefined) return "";
  const date = new Date(input);
  const diffMillis = Date.now() - date.getTime();

  if (fuzzy && diffMillis < fuzzy.millis) {
    // if fuzzyMillis and fuzzyText are both set, then for times less than fuzzyMillis, we return fuzzyText
    return fuzzy.text;
  }

  if (diffMillis <= MINUTE_MILLIS) return "< 1 minute ago";
  if (diffMillis <= TWO_MINUTE_MILLIS) return "1 minute ago";
  if (diffMillis < HOUR_MILLIS)
    return "" + (diffMillis / MINUTE_MILLIS).toFixed() + " minutes ago";

  if (diffMillis < TWO_HOUR_MILLIS) return "1 hour ago";
  if (diffMillis < DAY_MILLIS)
    return "" + (diffMillis / HOUR_MILLIS).toFixed() + " hours ago";

  if (diffMillis < TWO_DAY_MILLIS) return "1 day ago";
  if (diffMillis < WEEK_MILLIS)
    return "" + (diffMillis / DAY_MILLIS).toFixed() + " days ago";

  if (diffMillis < TWO_WEEK_MILLIS) return "1 week ago";
  if (diffMillis < MONTH_MILLIS)
    return "" + (diffMillis / WEEK_MILLIS).toFixed() + " weeks ago";

  if (diffMillis < TWO_MONTH_MILLIS) return "1 month ago";
  if (diffMillis < YEAR_MILLIS)
    return "" + (diffMillis / MONTH_MILLIS).toFixed() + " months ago";

  if (diffMillis < TWO_YEAR_MILLIS) return "1 year ago";
  return "" + (diffMillis / YEAR_MILLIS).toFixed() + " years ago";
}

export interface FuzzySpecT {
  millis: number;
  translationKey: Parameters<TFunction<"global", undefined>>[0];
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

  if (diffMillis < MINUTE_MILLIS)
    return t("relative_time.less_than_a_minute_ago");
  if (diffMillis < TWO_MINUTE_MILLIS) return t("relative_time.one_minute_ago");
  if (diffMillis < HOUR_MILLIS)
    return t("relative_time.x_minutes_ago", {
      date: (diffMillis / MINUTE_MILLIS).toFixed(),
    });

  if (diffMillis < TWO_HOUR_MILLIS) return t("relative_time.one_hour_ago");
  if (diffMillis < DAY_MILLIS)
    return t("relative_time.x_hours_ago", {
      date: (diffMillis / HOUR_MILLIS).toFixed(),
    });

  if (diffMillis < TWO_DAY_MILLIS) return t("relative_time.one_day_ago");
  if (diffMillis < WEEK_MILLIS)
    return t("relative_time.x_days_ago", {
      date: (diffMillis / DAY_MILLIS).toFixed(),
    });

  if (diffMillis < TWO_WEEK_MILLIS) return t("relative_time.one_week_ago");
  if (diffMillis < MONTH_MILLIS)
    return t("relative_time.x_weeks_ago", {
      date: (diffMillis / WEEK_MILLIS).toFixed(),
    });

  if (diffMillis < TWO_MONTH_MILLIS) return t("relative_time.one_month_ago");
  if (diffMillis < YEAR_MILLIS)
    return t("relative_time.x_months_ago", {
      date: (diffMillis / MONTH_MILLIS).toFixed(),
    });

  if (diffMillis < TWO_YEAR_MILLIS) return t("relative_time.one_year_ago");
  return t("relative_time.x_years_ago", {
    date: (diffMillis / YEAR_MILLIS).toFixed(),
  });
}
