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
  [dayMillis]: "1 day ago",
  [hourMillis]: "1 hour ago",
  [minuteMillis]: "< 1 minute ago",
  [monthMillis]: "1 month ago",
  [twoDayMillis]: "2 days ago",
  [twoHourMillis]: "2 hours ago",
  [twoMinuteMillis]: "1 minute ago",
  [twoMonthMillis]: "2 months ago",
  [twoWeekMillis]: "2 weeks ago",
  [twoYearMillis]: "2 years ago",
  [weekMillis]: "1 week ago",
  [yearMillis]: "1 year ago",
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
