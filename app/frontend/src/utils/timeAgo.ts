const minuteMillis = 60000;
const quaterHourMillis = 900000;
const hourMillis = 3600000;
const twoHourMillis = 7200000;
const dayMillis = 86400000;
const twoDayMillis = 172800000;
const weekMillis = 604800000;
const twoWeekMillis = 1209600000;
const monthMillis = weekMillis * 4;
const twoMonthMillis = weekMillis * 8;
const yearMillis = 31557600000;
const twoYearMillis = 31557600000 * 2;

export function timeAgo(input: Date | string) {
  if (input === undefined) return "";
  const date = new Date(input);
  const diffMillis = Date.now() - date.getTime();

  //the backend fuzzes times to 15 minute intervals
  if (diffMillis < quaterHourMillis) return "less than 15 minutes ago";
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
