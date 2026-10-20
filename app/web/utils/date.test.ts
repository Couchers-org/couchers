import { Temporal } from "temporal-polyfill";
import { approxDateDuration, approxTimeDuration } from "utils/date";

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
