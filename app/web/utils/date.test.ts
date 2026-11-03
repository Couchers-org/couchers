import { Temporal } from "temporal-polyfill";
import { approxDateDuration, approxTimeDuration, endOfDay, startOfDay } from "utils/date";

describe("approxTimeDuration", () => {
  it("converts years, months, weeks and days to hours", () => {
    expect(approxTimeDuration(Temporal.Duration.from({ years: 1, months: 2, weeks: 3, days: 4 })).hours).toBe(
      (365 * 1 + 30 * 2 + 7 * 3 + 1 * 4) * 24,
    );
  });
});

describe("approxDateDuration", () => {
  it("converts hours to days, weeks, months and years", () => {
    expect(
      approxDateDuration(
        Temporal.Duration.from({
          hours: (365 * 1 + 30 * 2 + 7 * 3 + 1 * 4) * 24,
        }),
      ).toString(),
    ).toBe("P1Y2M3W4D");
  });
});

describe("startOfDay", () => {
  it("is midnight in the given timezone", () => {
    expect(startOfDay(Temporal.PlainDate.from("2021-01-10"), "Etc/UTC").toString()).toBe("2021-01-10T00:00:00Z");
    // EST (UTC-5)
    expect(startOfDay(Temporal.PlainDate.from("2021-01-10"), "America/New_York").toString()).toBe(
      "2021-01-10T05:00:00Z",
    );
    // EDT (UTC-4)
    expect(startOfDay(Temporal.PlainDate.from("2021-07-10"), "America/New_York").toString()).toBe(
      "2021-07-10T04:00:00Z",
    );
  });
});

describe("endOfDay", () => {
  it("is midnight at the start of the next day in the given timezone", () => {
    expect(endOfDay(Temporal.PlainDate.from("2021-01-10"), "Etc/UTC").toString()).toBe("2021-01-11T00:00:00Z");
    expect(endOfDay(Temporal.PlainDate.from("2021-01-10"), "America/New_York").toString()).toBe("2021-01-11T05:00:00Z");
  });

  it("uses the offset in effect at the end of the day", () => {
    // New York springs forward from EST to EDT during 2021-03-14.
    expect(endOfDay(Temporal.PlainDate.from("2021-03-13"), "America/New_York").toString()).toBe("2021-03-14T05:00:00Z");
    expect(endOfDay(Temporal.PlainDate.from("2021-03-14"), "America/New_York").toString()).toBe("2021-03-15T04:00:00Z");
  });
});
