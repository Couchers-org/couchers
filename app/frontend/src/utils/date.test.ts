import { isSameOrFutureDate } from "utils/date";
import dayjs from "utils/dayjs";

const FUTURE = dayjs("02-15-2025");
const PAST = dayjs("10-05-1991");
const TODAY = dayjs("03-25-2021");

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
