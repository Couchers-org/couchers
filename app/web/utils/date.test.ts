import {
  getDateFormatYMD,
  isSameOrFutureDate,
  localizeDateTime,
  UTC_TIMEZONE,
} from "utils/date";
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
      }),
    ).toContain("2000");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDate: false,
      }),
    ).not.toContain("2000");
  });

  it("honors abbreviated month names", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
      }),
    ).toContain("January");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        abbreviate: true,
      }),
    ).not.toContain("uary");
  });

  it("includes the day of week when specified", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDayOfWeek: false,
      }),
    ).not.toContain("Sat");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDayOfWeek: true,
      }),
    ).toContain("Saturday");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeDayOfWeek: true,
        abbreviate: true,
      }),
    ).toContain("Sat");
  });

  it("excludes times when specified", () => {
    expect(
      localizeDateTime(dayjs("2000-01-01").add(11, "hours"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
      }),
    ).toContain("11");
    expect(
      localizeDateTime(dayjs("2000-01-01").add(11, "hours"), {
        timezone: UTC_TIMEZONE,
        locale: "en",
        includeTime: false,
      }),
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
      }),
    ).toContain("January");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "en-US",
      }),
    ).toContain("January");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "es",
      }),
    ).toContain("enero");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "de",
      }),
    ).toContain("Januar");
  });
});

describe("getDateFormatYMD", () => {
  it("works for common locales", () => {
    expect(getDateFormatYMD("en")).toEqual("MM/DD/YYYY");
    expect(getDateFormatYMD("de")).toEqual("DD.MM.YYYY");
    expect(getDateFormatYMD("ja-JP")).toEqual("YYYY/MM/DD");
    expect(getDateFormatYMD("fr-CA")).toEqual("YYYY-MM-DD");
  });

  it("works for generic and specific locales", () => {
    expect(getDateFormatYMD("ja")).toEqual("YYYY/MM/DD");
    expect(getDateFormatYMD("ja-JP")).toEqual("YYYY/MM/DD");
  });

  it("returns a default value for unsupported locales", () => {
    expect(getDateFormatYMD("xx")).toEqual("YYYY-MM-DD");
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
