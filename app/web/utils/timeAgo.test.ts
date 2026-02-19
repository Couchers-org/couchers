import { TFunction, TOptions } from "i18next";

import {
  dayMillis,
  FriendlyTimeSpan,
  hourMillis,
  minuteMillis,
  monthMillis,
  secondMillis,
  timeAgo,
  TimeUnit,
  weekMillis,
} from "./timeAgo";

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(1614556800000);
});

test("FriendlyTimeSpan.fromMillis", () => {
  expect(FriendlyTimeSpan.fromMillis(5 * secondMillis)).toEqual(
    new FriendlyTimeSpan(5, TimeUnit.Seconds),
  );
  expect(FriendlyTimeSpan.fromMillis(125 * secondMillis)).toEqual(
    new FriendlyTimeSpan(2, TimeUnit.Minutes),
  );
  expect(FriendlyTimeSpan.fromMillis(125 * minuteMillis)).toEqual(
    new FriendlyTimeSpan(2, TimeUnit.Hours),
  );
  expect(FriendlyTimeSpan.fromMillis(48 * hourMillis)).toEqual(
    new FriendlyTimeSpan(2, TimeUnit.Days),
  );
  expect(FriendlyTimeSpan.fromMillis(8 * dayMillis)).toEqual(
    new FriendlyTimeSpan(1, TimeUnit.Weeks),
  );
  expect(FriendlyTimeSpan.fromMillis(6 * weekMillis)).toEqual(
    new FriendlyTimeSpan(1, TimeUnit.Months),
  );
  expect(FriendlyTimeSpan.fromMillis(30 * monthMillis)).toEqual(
    new FriendlyTimeSpan(2, TimeUnit.Years),
  );
});

/// Mock translation function, returns "key,count"
const mockT = ((key: string, options?: TOptions): string => {
  if (options && options.count) {
    return `${key},${options.count}`;
  }
  return key;
}) as TFunction;

test("timeAgo function, normal case", () => {
  const now = Date.now();
  const before = new Date(now - 8.5 * hourMillis);
  const timeString = timeAgo({ since: before, t: mockT, locale: "es" });
  expect(timeString).toBe("hace 8 horas");
});

test("timeAgo function with minimum unit", () => {
  const now = Date.now();
  const date = new Date(now - 2 * minuteMillis);
  const lessThanHour = "global:relative_time.less_than_one_hour_ago";
  const timeString = timeAgo({
    since: date,
    t: mockT,
    locale: "en",
    minimumUnit: TimeUnit.Hours,
  });
  expect(timeString).toBe(lessThanHour);
});
