import { t } from "i18next";

import {
  DAY_MILLIS,
  HOUR_MILLIS,
  MINUTE_MILLIS,
  MONTH_MILLIS,
  TWO_DAY_MILLIS,
  TWO_HOUR_MILLIS,
  TWO_MINUTE_MILLIS,
  TWO_MONTH_MILLIS,
  TWO_WEEK_MILLIS,
  TWO_YEAR_MILLIS,
  WEEK_MILLIS,
  YEAR_MILLIS,
  timeAgoI18n,
} from "./timeAgo";

const timeAgoMap: Record<number, string | [string, number]> = {
  [DAY_MILLIS]: "one_day_ago",
  [HOUR_MILLIS]: "one_hour_ago ",
  [MINUTE_MILLIS]: "less_than_a_minute_ago",
  [MONTH_MILLIS]: "one_month_ago",
  [TWO_DAY_MILLIS]: ["x_days_ago", 2],
  [TWO_HOUR_MILLIS]: ["x_hours_ago", 2],
  [TWO_MINUTE_MILLIS]: "one_minute_ago",
  [TWO_MONTH_MILLIS]: ["x_months_ago", 2],
  [TWO_WEEK_MILLIS]: ["x_weeks_ago", 2],
  [TWO_YEAR_MILLIS]: ["x_years_ago", 2],
  [WEEK_MILLIS]: "one_week_ago",
  [YEAR_MILLIS]: "one_year_ago",
};

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(1614556800000);
});

it("timeAgo function", () => {
  Object.keys(timeAgoMap).forEach((key: string) => {
    const now = Date.now();
    const millis = parseInt(key);

    const tInput = timeAgoMap[millis];

    const expectedValue =
      typeof tInput === "string"
        ? t(`relative_time.${tInput}`)
        : t(`relative_time.${tInput[0]}`, { date: tInput[1] });

    const date = new Date(now - millis);
    const timeString = timeAgoI18n({ input: date, t: t });
    expect(timeString).toBe(expectedValue);
  });
});

it("timeAgo function with fuzzy", () => {
  const now = Date.now();
  const date = new Date(now - TWO_MINUTE_MILLIS);
  const translationKey = "relative_time.less_than_one_hour_ago";
  const timeString = timeAgoI18n({
    input: date,
    t,
    fuzzy: {
      millis: HOUR_MILLIS,
      translationKey,
    },
  });
  expect(timeString).toBe(t(translationKey));
});
