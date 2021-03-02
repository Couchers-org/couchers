import {
  dayMillis,
  hourMillis,
  minuteMillis,
  monthMillis,
  timeAgo,
  twoDayMillis,
  twoHourMillis,
  twoMinuteMillis,
  twoMonthMillis,
  twoWeekMillis,
  twoYearMillis,
  weekMillis,
  yearMillis,
} from "./timeAgo";

const timeAgoMap = {
  [minuteMillis]: "< 1 minute ago",
  [twoMinuteMillis]: "1 minute ago",
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
  Object.keys(timeAgoMap).forEach((key: string) => {
    const now = Date.now();
    const millis = parseInt(key);
    const expectedValue = timeAgoMap[millis];
    const date = new Date(now - millis);
    const timeString = timeAgo(date);
    expect(timeString).toBe(expectedValue);
  });
});

test("timeAgo function with fuzzy", () => {
  const now = Date.now();
  const date = new Date(now - twoMinuteMillis);
  const timeString = timeAgo(date, true);
  expect(timeString).toBe("< 15 minutes ago");
});
