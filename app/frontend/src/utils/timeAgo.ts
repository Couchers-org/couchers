export const minuteMillis = 60000;
export const twoMinuteMillis = 120000;
export const quarterHourMillis = 900000;
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

export function timeAgo(input: Date | string, fuzzy: boolean = false) {
  if (input === undefined) return "";
  const date = new Date(input);
  const diffMillis = Date.now() - date.getTime();

  if (fuzzy && diffMillis < quarterHourMillis) {
    return "< 15 minutes ago";
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
