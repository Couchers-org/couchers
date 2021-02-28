import {
  dayMillis,
  hourMillis,
  minuteMillis,
  monthMillis,
  quaterHourMillis,
  timeAgo,
  twoDayMillis,
  twoHourMillis,
  twoMonthMillis,
  twoWeekMillis,
  twoYearMillis,
  weekMillis,
  yearMillis,
} from "./timeAgo";

const timeAgoMap = {
  [minuteMillis]: "< 15 minutes ago",
  [quaterHourMillis]: "15 minutes ago",
  [hourMillis]: "1 hour ago",
  [twoHourMillis]: "2 hours ago",
  [dayMillis]: "1 day ago",
  [twoDayMillis]: "2 days ago",
  [weekMillis]: "1 week ago",
  [twoWeekMillis]: "2 weeks ago",
  [monthMillis]: "1 month ago",
  [twoMonthMillis]: "2 months ago",
  [yearMillis]: "1 year ago",
  [twoYearMillis]: "2 years ago",
};

test("timeAgo function", () => {
  const now = Date.now();

  Object.keys(timeAgoMap).forEach((key: string) => {
    const millis = parseInt(key);
    const value = timeAgoMap[millis];
    const date = new Date(now - millis);
    const s = timeAgo(date);
    expect(s).toBe(value);
  });
});
