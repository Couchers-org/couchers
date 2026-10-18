import { classifyWhenHappening } from "./utils";

function stay(fromDate: string, toDate: string, timezone: string) {
  return { fromDate, toDate, timezone };
}

describe("classifyWhenHappening", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("classifies relative to the start and end of the stay's dates", () => {
    jest.setSystemTime(new Date("2000-01-01T12:00:00Z"));
    expect(classifyWhenHappening(stay("2000-01-04", "2000-01-05", "Etc/UTC"))).toBe("future");
    expect(classifyWhenHappening(stay("2000-01-03", "2000-01-04", "Etc/UTC"))).toBe("soon");
    expect(classifyWhenHappening(stay("1999-12-31", "2000-01-02", "Etc/UTC"))).toBe("now");
    expect(classifyWhenHappening(stay("1999-12-29", "1999-12-30", "Etc/UTC"))).toBe("past");
  });

  it("interprets the dates in the stay's timezone", () => {
    jest.setSystemTime(new Date("2000-01-01T00:00:00Z"));
    // At this instant it is 2000-01-01T00:00 in UTC but still 1999-12-31T19:00 in New York (UTC-5).
    expect(classifyWhenHappening(stay("2000-01-01", "2000-01-02", "Etc/UTC"))).toBe("now");
    expect(classifyWhenHappening(stay("2000-01-01", "2000-01-02", "America/New_York"))).toBe("soon");
    expect(classifyWhenHappening(stay("1999-12-30", "1999-12-31", "Etc/UTC"))).toBe("past");
    expect(classifyWhenHappening(stay("1999-12-30", "1999-12-31", "America/New_York"))).toBe("now");
    expect(classifyWhenHappening(stay("2000-01-02", "2000-01-03", "Etc/UTC"))).toBe("soon");
    expect(classifyWhenHappening(stay("2000-01-03", "2000-01-04", "America/New_York"))).toBe("future");
  });
});
