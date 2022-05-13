import { parse } from "querystring";

import {
  parsedQueryToSearchFilters,
  parseSearchFiltersToQuery,
} from "./SearchFilters";

describe("parsedQueryToSearchFilters", () => {
  it("should return a SearchFilters object parsing the URL parameters", () => {
    const parsedQuery = parse(
      "location=City+of+Albany%2C+New+York%2C+United+States&lat=42.6511674&lng=-73.754968&numGuests=3"
    );
    expect(parsedQueryToSearchFilters(parsedQuery)).toEqual({
      location: "City of Albany, New York, United States",
      lat: 42.6511674,
      lng: -73.754968,
      numGuests: 3,
    });
  });
});

describe("parseSearchFiltersToQuery", () => {
  it("should return empty string when there are no filters", () => {
    expect(parseSearchFiltersToQuery({})).toBe("");
  });
  it("should return a string with encoded URL params when there are filters set", () => {
    expect(
      parseSearchFiltersToQuery({
        location: "City of Albany, New York, United States",
        lat: 42.6511674,
        lng: -73.754968,
        numGuests: 3,
      })
    ).toBe(
      "location=City+of+Albany%2C+New+York%2C+United+States&lat=42.6511674&lng=-73.754968&numGuests=3"
    );
  });
});
