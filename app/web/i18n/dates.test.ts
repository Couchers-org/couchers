import {
  getMuiDateFormat,
  getMuiTimeFormat,
  localizeDateTime,
  UTC_TIMEZONE,
} from "i18n/dates";
import dayjs from "utils/dayjs";

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
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "pt-BR",
      }),
    ).toContain("janeiro");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "ca",
      }),
    ).toContain("gener");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "zh-Hans",
      }),
    ).toContain("1月");
    expect(
      localizeDateTime(dayjs("2000-01-01"), {
        timezone: UTC_TIMEZONE,
        locale: "zh-Hant",
      }),
    ).toContain("1月");
  });

  it("does not capitalize day/month names by default (assumed mid-sentence)", () => {
    // Spanish weekday + month stay lowercase when the date may be part of a sentence.
    const formatted = localizeDateTime(dayjs("2000-01-01"), {
      timezone: UTC_TIMEZONE,
      locale: "es",
      includeDayOfWeek: true,
      includeTime: false,
    });
    expect(formatted).toMatch(/^sábado/);
    expect(formatted).toContain("enero");
  });

  it("capitalizes only the first letter when capitalize is set (standalone date)", () => {
    const formatted = localizeDateTime(dayjs("2000-01-01"), {
      timezone: UTC_TIMEZONE,
      locale: "es",
      includeDayOfWeek: true,
      includeTime: false,
      capitalize: true,
    });
    expect(formatted).toMatch(/^Sábado/);
    // day/month names mid-string are still lowercase
    expect(formatted).toContain("enero");
  });

  it("leaves a non-letter first grapheme unchanged when capitalize is set", () => {
    // Spanish dates without a weekday start with the day number.
    const formatted = localizeDateTime(dayjs("2000-01-01"), {
      timezone: UTC_TIMEZONE,
      locale: "es",
      includeTime: false,
      capitalize: true,
    });
    expect(formatted).toMatch(/^1 de enero/);
  });
});

describe("getMuiDateFormat", () => {
  it("works for common locales", () => {
    expect(getMuiDateFormat("en")).toEqual("MM/DD/YYYY");
    expect(getMuiDateFormat("de")).toEqual("DD.MM.YYYY");
    expect(getMuiDateFormat("ja-JP")).toEqual("YYYY/MM/DD");
    expect(getMuiDateFormat("fr-CA")).toEqual("YYYY-MM-DD");
  });

  it("works for generic and specific locales", () => {
    expect(getMuiDateFormat("ja")).toEqual("YYYY/MM/DD");
    expect(getMuiDateFormat("ja-JP")).toEqual("YYYY/MM/DD");
  });

  it("returns a default value for unsupported locales", () => {
    expect(getMuiDateFormat("xx")).toEqual("YYYY-MM-DD");
  });
});

describe("getMuiTimeFormat", () => {
  it("works for common locales", () => {
    expect(getMuiTimeFormat("en")).toEqual("h:mm a");
    expect(getMuiTimeFormat("de")).toEqual("HH:mm");
    expect(getMuiTimeFormat("ja-JP")).toEqual("H:mm");
  });

  it("works for generic and specific locales", () => {
    expect(getMuiTimeFormat("ja")).toEqual("H:mm");
    expect(getMuiTimeFormat("ja-JP")).toEqual("H:mm");
  });

  it("returns a default value for unsupported locales", () => {
    expect(getMuiTimeFormat("xx")).toEqual("HH:mm");
  });
});
