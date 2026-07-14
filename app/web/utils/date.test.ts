import { Temporal } from "temporal-polyfill";
import {
  getMuiDateFormat,
  getMuiTimeFormat,
  localizeDateTime,
} from "utils/date";

const janFirst2000 = Temporal.PlainDateTime.from("2000-01-01");

describe("localizeDateTime", () => {
  it("excludes dates when specified", () => {
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
      }),
    ).toContain("2000");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
        includeDate: false,
      }),
    ).not.toContain("2000");
  });

  it("honors abbreviated month names", () => {
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
      }),
    ).toContain("January");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
        abbreviate: true,
      }),
    ).not.toContain("uary");
  });

  it("includes the day of week when specified", () => {
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
        includeDayOfWeek: false,
      }),
    ).not.toContain("Sat");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
        includeDayOfWeek: true,
      }),
    ).toContain("Saturday");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
        includeDayOfWeek: true,
        abbreviate: true,
      }),
    ).toContain("Sat");
  });

  it("excludes times when specified", () => {
    expect(
      localizeDateTime(janFirst2000.add({ hours: 11 }), {
        locale: "en",
      }),
    ).toContain("11");
    expect(
      localizeDateTime(janFirst2000.add({ hours: 11 }), {
        locale: "en",
        includeTime: false,
      }),
    ).not.toContain("11");
  });

  it("includes seconds when specified", () => {
    expect(
      localizeDateTime(janFirst2000.add({ seconds: 42 }), {
        locale: "en",
        includeSeconds: false,
      }),
    ).not.toContain("42");
    expect(
      localizeDateTime(janFirst2000.add({ seconds: 42 }), {
        locale: "en",
        includeSeconds: true,
      }),
    ).toContain("42");
  });

  it("honors the locale", () => {
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en",
      }),
    ).toContain("January");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "en-US",
      }),
    ).toContain("January");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "es",
      }),
    ).toContain("enero");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "de",
      }),
    ).toContain("Januar");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "pt-BR",
      }),
    ).toContain("janeiro");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "ca",
      }),
    ).toContain("gener");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "zh-Hans",
      }),
    ).toContain("1月");
    expect(
      localizeDateTime(janFirst2000, {
        locale: "zh-Hant",
      }),
    ).toContain("1月");
  });

  it("does not capitalize day/month names by default (assumed mid-sentence)", () => {
    // Spanish weekday + month stay lowercase when the date may be part of a sentence.
    const formatted = localizeDateTime(janFirst2000, {
      locale: "es",
      includeDayOfWeek: true,
      includeTime: false,
    });
    expect(formatted).toMatch(/^sábado/);
    expect(formatted).toContain("enero");
  });

  it("capitalizes only the first letter when capitalize is set (standalone date)", () => {
    const formatted = localizeDateTime(janFirst2000, {
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
    const formatted = localizeDateTime(janFirst2000, {
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
