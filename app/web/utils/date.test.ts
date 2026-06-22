import { isSameOrFutureDate } from "utils/date";
import dayjs from "utils/dayjs";

const FUTURE = dayjs("2025-02-15");
const PAST = dayjs("1991-10-05");
const TODAY = dayjs("2021-03-25");

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
