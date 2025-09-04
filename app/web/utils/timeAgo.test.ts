import {
  DAY_MILLIS,
  HOUR_MILLIS,
  LESS_THAN_HOUR,
  MINUTE_MILLIS,
  MONTH_MILLIS,
  TWO_DAY_MILLIS,
  TWO_HOUR_MILLIS,
  TWO_MINUTE_MILLIS,
  TWO_MONTH_MILLIS,
  TWO_WEEK_MILLIS,
  WEEK_MILLIS,
  YEAR_MILLIS,
  timeAgo,
  twoYearMillis,
} from "./timeAgo";

const timeAgoMap = {
  [DAY_MILLIS]: "1 day ago",
  [HOUR_MILLIS]: "1 hour ago",
  [MINUTE_MILLIS]: "< 1 minute ago",
  [MONTH_MILLIS]: "1 month ago",
  [TWO_DAY_MILLIS]: "2 days ago",
  [TWO_HOUR_MILLIS]: "2 hours ago",
  [TWO_MINUTE_MILLIS]: "1 minute ago",
  [TWO_MONTH_MILLIS]: "2 months ago",
  [TWO_WEEK_MILLIS]: "2 weeks ago",
  [twoYearMillis]: "2 years ago",
  [WEEK_MILLIS]: "1 week ago",
  [YEAR_MILLIS]: "1 year ago",
};

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(1614556800000);
});

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
  const date = new Date(now - TWO_MINUTE_MILLIS);
  const timeString = timeAgo(date, {
    millis: HOUR_MILLIS,
    text: LESS_THAN_HOUR,
  });
  expect(timeString).toBe(LESS_THAN_HOUR);
});
