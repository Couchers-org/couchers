import { TFunction } from "i18next";

export const minuteMillis = 60000;
export const twoMinuteMillis = 120000;
export const hourMillis = 3600000;
export const twoHourMillis = 7200000;
export const dayMillis = 86400000;
export const twoDayMillis = 172800000;
export const weekMillis = 604800000;
export const twoWeekMillis = 1209600000;
export const monthMillis = weekMillis * 4;
export const twoMonthMillis = weekMillis * 8;
export const yearMillis = 31557600000;
export const twoYearMillis = 31557600000 * 2;

export const lessThanHour = "Less than an hour ago";

interface FuzzySpec {
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

  if (diffMillis <= minuteMillis) return "< 1 minute ago";
  if (diffMillis <= twoMinuteMillis) return "1 minute ago";
  if (diffMillis < hourMillis)
    return "" + (diffMillis / minuteMillis).toFixed() + " minutes ago";

  if (diffMillis < twoHourMillis) return "1 hour ago";
  if (diffMillis < dayMillis)
    return "" + (diffMillis / hourMillis).toFixed() + " hours ago";

  if (diffMillis < twoDayMillis) return "1 day ago";
  if (diffMillis < weekMillis)
    return "" + (diffMillis / dayMillis).toFixed() + " days ago";

  if (diffMillis < twoWeekMillis) return "1 week ago";
  if (diffMillis < monthMillis)
    return "" + (diffMillis / weekMillis).toFixed() + " weeks ago";

  if (diffMillis < twoMonthMillis) return "1 month ago";
  if (diffMillis < yearMillis)
    return "" + (diffMillis / monthMillis).toFixed() + " months ago";

  if (diffMillis < twoYearMillis) return "1 year ago";
  return "" + (diffMillis / yearMillis).toFixed() + " years ago";
}

interface FuzzySpecT {
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

  if (diffMillis < minuteMillis)
    return t("relative_time.less_than_a_minute_ago");
  if (diffMillis < hourMillis)
    return t("relative_time.n_minutes_ago", {
      count: Math.floor(diffMillis / minuteMillis),
    });

  if (diffMillis < dayMillis)
    return t("relative_time.n_hours_ago", {
      count: Math.floor(diffMillis / hourMillis),
    });

  if (diffMillis < weekMillis)
    return t("relative_time.n_days_ago", {
      count: Math.floor(diffMillis / dayMillis),
    });

  if (diffMillis < monthMillis)
    return t("relative_time.n_weeks_ago", {
      count: Math.floor(diffMillis / weekMillis),
    });

  if (diffMillis < yearMillis)
    return t("relative_time.n_months_ago", {
      count: Math.floor(diffMillis / monthMillis),
    });

  return t("relative_time.n_years_ago", {
    count: Math.floor(diffMillis / yearMillis),
  });
}
