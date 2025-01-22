import { parse } from "querystring";

import {
  parsedQueryToSearchFilters,
  parseSearchFiltersToQuery,
} from "./searchFilters";

function overrideConsoleWarn() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalConsoleWarn: (message?: any, ...optionalParams: any[]) => void;
  beforeEach(() => {
    originalConsoleWarn = console.warn;
    console.warn = jest.fn();
  });
  afterEach(() => {
    console.warn = originalConsoleWarn;
  });
}

describe("parsedQueryToSearchFilters", () => {
  overrideConsoleWarn();

  it("should return an empty object when there are no parameters", () => {
    expect(parsedQueryToSearchFilters(parse(""))).toEqual({});
  });
  it("should return an empty object when there are no supported parameters", () => {
    expect(parsedQueryToSearchFilters(parse("a=1&b=2"))).toEqual({});
  });
  it("should return a SearchFilters object parsing the URL parameters that a simple search produces", () => {
    const parsedQuery = parse(
      "location=City+of+Albany%2C+New+York%2C+United+States",
    );
    expect(parsedQueryToSearchFilters(parsedQuery)).toEqual({
      location: "City of Albany, New York, United States",
    });
  });
  it("should return a SearchFilters object parsing the URL parameters with all filters", () => {
    const parsedQuery = parse(
      "location=Madrid%2C+Community+of+Madrid%2C+Spain&query=bike&lastActive=14&hostingStatusOptions=2&hostingStatusOptions=3&numGuests=2",
    );
    expect(parsedQueryToSearchFilters(parsedQuery)).toEqual({
      location: "Madrid, Community of Madrid, Spain",
      numGuests: 2,
      lastActive: 14,
      hostingStatusOptions: [2, 3],
      query: "bike",
    });
  });
});

describe("parseSearchFiltersToQuery", () => {
  it("should return empty string when there are no filters", () => {
    expect(parseSearchFiltersToQuery({})).toBe("");
  });
  it("should return a string with encoded URL params when there are simple search filters set", () => {
    expect(
      parseSearchFiltersToQuery({
        location: "City of Albany, New York, United States",
        numGuests: 3,
      }),
    ).toBe("location=City+of+Albany%2C+New+York%2C+United+States&numGuests=3");
  });
  it("should return a string with encoded URL params when all filters are set", () => {
    expect(
      parseSearchFiltersToQuery({
        location: "Madrid, Community of Madrid, Spain",
        numGuests: 2,
        lastActive: 14,
        hostingStatusOptions: [2, 3],
        query: "bike",
      }),
    ).toBe(
      "location=Madrid%2C+Community+of+Madrid%2C+Spain&numGuests=2&lastActive=14&hostingStatusOptions=2&hostingStatusOptions=3&query=bike",
    );
  });
});
