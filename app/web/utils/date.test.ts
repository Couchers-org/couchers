import { isSameOrFutureDate, localizeDateTime, UTC_TIMEZONE } from "utils/date";
import dayjs from "utils/dayjs";

const FUTURE = dayjs("2025-02-15");
const PAST = dayjs("1991-10-05");
const TODAY = dayjs("2021-03-25");

describe("localizeDateTime", () => {
  it("excludes dates when specified", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
      }).toLowerCase(),
    ).toContain("2000");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDate: false,
      }).toLowerCase(),
    ).not.toContain("2000");
  });

  it("honors abbreviated month names", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
      }).toLowerCase(),
    ).toContain("january");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        abbreviate: true,
      }).toLowerCase(),
    ).not.toContain("uary");
  });

  it("includes the day of week when specified", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDayOfWeek: false,
      }).toLowerCase(),
    ).not.toContain("sat");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDayOfWeek: true,
      }).toLowerCase(),
    ).toContain("saturday");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDayOfWeek: true,
        abbreviate: true,
      }).toLowerCase(),
    ).toContain("sat");
  });

  it("excludes times when specified", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01").add(11, "hours"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
      }).toLowerCase(),
    ).toContain("11");
    expect(
      localizeDateTime(dayjs("2000-01-01").add(11, "hours"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeTime: false,
      }).toLowerCase(),
    ).not.toContain("11");
  });

  it("includes seconds when specified", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01").add(42, "seconds"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeSeconds: false,
      }),
    ).not.toContain("42");
    expect(
      localizeDateTime(dayjs("2000-01-01").add(42, "seconds"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeSeconds: true,
      }),
    ).toContain("42");
  });

  it("honors the locale", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
      }).toLowerCase(),
    ).toContain("jan");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "es",
      }).toLowerCase(),
    ).toContain(
      "ene", // enero = january
    );
  });
});

describe("isSameOrFutureDate", () => {
  it("returns true when is same date", () => {
    expect(isSameOrFutureDate(TODAY, TODAY)).toEqual(true);
  });

  it("returns true when date is in future", () => {
    expect(isSameOrFutureDate(FUTURE, TODAY)).toEqual(true);
  });

  it("returns false when second date is in past", () => {
    expect(isSameOrFutureDate(PAST, TODAY)).toEqual(false);
  });
});
