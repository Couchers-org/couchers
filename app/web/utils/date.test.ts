import { TFunction } from "i18next";
import { Temporal } from "temporal-polyfill";
import {
  getMuiDateFormat,
  getMuiTimeFormat,
  localizeDateTime,
  localizeDurationLargestUnit,
  localizeRelativeInstant,
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

describe("localizeDurationLargestUnit", () => {
  it("works with positive durations", () => {
    expect(
      localizeDurationLargestUnit(
        Temporal.Duration.from({ milliseconds: 1 }),
        "en",
        { numeric: "always" },
      ),
    ).toBe("in 0 seconds");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ seconds: 1 }), "en"),
    ).toBe("in 1 second");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ seconds: 5 }), "en"),
    ).toBe("in 5 seconds");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ minutes: 1 }), "en"),
    ).toBe("in 1 minute");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ minutes: 5 }), "en"),
    ).toBe("in 5 minutes");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ hours: 1 }), "en"),
    ).toBe("in 1 hour");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ hours: 5 }), "en"),
    ).toBe("in 5 hours");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ days: 1 }), "en", {
        numeric: "always",
      }),
    ).toBe("in 1 day");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ days: 5 }), "en"),
    ).toBe("in 5 days");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ weeks: 1 }), "en", {
        numeric: "always",
      }),
    ).toBe("in 1 week");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ weeks: 5 }), "en"),
    ).toBe("in 5 weeks");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ months: 1 }), "en", {
        numeric: "always",
      }),
    ).toBe("in 1 month");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ months: 5 }), "en"),
    ).toBe("in 5 months");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ years: 1 }), "en", {
        numeric: "always",
      }),
    ).toBe("in 1 year");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ years: 5 }), "en"),
    ).toBe("in 5 years");
  });

  it("works with negative durations", () => {
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ hours: -5 }), "en"),
    ).toBe("5 hours ago");
  });

  it("works with other locales", () => {
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ hours: 5 }), "fr"),
    ).toBe("dans 5 heures");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ hours: 5 }), "es"),
    ).toBe("dentro de 5 horas");
  });

  it("uses friendly readable forms for date unit deltas of 1", () => {
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ days: -1 }), "en", {
        numeric: "auto",
      }),
    ).toBe("yesterday");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ days: 1 }), "en", {
        numeric: "auto",
      }),
    ).toBe("tomorrow");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ weeks: -1 }), "en", {
        numeric: "auto",
      }),
    ).toBe("last week");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ weeks: 1 }), "en", {
        numeric: "auto",
      }),
    ).toBe("next week");
    expect(
      localizeDurationLargestUnit(
        Temporal.Duration.from({ months: -1 }),
        "en",
        { numeric: "auto" },
      ),
    ).toBe("last month");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ months: 1 }), "en", {
        numeric: "auto",
      }),
    ).toBe("next month");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ years: -1 }), "en", {
        numeric: "auto",
      }),
    ).toBe("last year");
    expect(
      localizeDurationLargestUnit(Temporal.Duration.from({ years: 1 }), "en", {
        numeric: "auto",
      }),
    ).toBe("next year");
  });

  it("honors the smallest unit", () => {
    expect(
      localizeDurationLargestUnit(
        Temporal.Duration.from({ seconds: 1 }),
        "en",
        {
          numeric: "always",
          smallestUnit: "minutes",
        },
      ),
    ).toBe("in 0 minutes");
    expect(
      localizeDurationLargestUnit(
        Temporal.Duration.from({ minutes: 1 }),
        "en",
        { smallestUnit: "minutes" },
      ),
    ).toBe("in 1 minute");
  });

  it("supports 'less than 1 <unit> ago' forms", () => {
    const mockT = ((key: string): string => key) as TFunction;

    expect(
      localizeDurationLargestUnit(
        Temporal.Duration.from({ seconds: -1 }),
        "en",
        { smallestUnit: "minutes", t: mockT },
      ),
    ).toBe("global:relative_time.less_than_a_minute_ago");
    expect(
      localizeDurationLargestUnit(
        Temporal.Duration.from({ minutes: -1 }),
        "en",
        { smallestUnit: "minutes", t: mockT },
      ),
    ).toBe("1 minute ago");
  });

  it("supports capitalizing", () => {
    expect(
      localizeDurationLargestUnit(
        Temporal.Duration.from({ seconds: 1 }),
        "en",
        { standalone: true },
      ),
    ).toBe("In 1 second");
  });
});

describe("localizeRelativeInstant", () => {
  const instantZero = new Temporal.Instant(0n);
  const nanosecondsPerHour = instantZero.add(
    Temporal.Duration.from({ hours: 1 }),
  ).epochNanoseconds;
  const nanosecondsPerDay = nanosecondsPerHour * 24n;

  it("handles time units", () => {
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerHour * 5n),
        "en",
        { relativeTo: instantZero },
      ),
    ).toBe("in 5 hours");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerHour * -5n),
        "en",
        { relativeTo: instantZero },
      ),
    ).toBe("5 hours ago");
  });

  it("handles date units", () => {
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 6n),
        "en",
        { relativeTo: instantZero },
      ),
    ).toBe("in 6 days");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 7n),
        "en",
        {
          numeric: "always",
          relativeTo: instantZero,
        },
      ),
    ).toBe("in 1 week");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 13n),
        "en",
        {
          numeric: "always",
          relativeTo: instantZero,
        },
      ),
    ).toBe("in 1 week");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 14n),
        "en",
        { relativeTo: instantZero },
      ),
    ).toBe("in 2 weeks");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 29n),
        "en",
        { relativeTo: instantZero },
      ),
    ).toBe("in 4 weeks");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 30n),
        "en",
        {
          numeric: "always",
          relativeTo: instantZero,
        },
      ),
    ).toBe("in 1 month");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 364n),
        "en",
        { relativeTo: instantZero },
      ),
    ).toBe("in 12 months"); // We approximate months as 30 days
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * 365n),
        "en",
        {
          numeric: "always",
          relativeTo: instantZero,
        },
      ),
    ).toBe("in 1 year"); // We approximate years as 365 days
  });

  it("handles date units with negative durations", () => {
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * -13n),
        "en",
        {
          numeric: "always",
          relativeTo: instantZero,
        },
      ),
    ).toBe("1 week ago");
    expect(
      localizeRelativeInstant(
        new Temporal.Instant(nanosecondsPerDay * -14n),
        "en",
        {
          numeric: "always",
          relativeTo: instantZero,
        },
      ),
    ).toBe("2 weeks ago");
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
