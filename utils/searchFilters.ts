import { ParsedUrlQuery } from "querystring";
import { UserSearchFilters as ServiceUserSearchFilters } from "service/search";
import stringOrFirstString from "utils/stringOrFirstString";

export default interface SearchFilters extends ServiceUserSearchFilters {
  location?: string;
}

/**
 * Parses a URL search query into an object with all the search filter properties found
 */
export function parsedQueryToSearchFilters(urlQuery: ParsedUrlQuery) {
  const filters: SearchFilters = {};
  Array.from(Object.keys(urlQuery)).forEach((key) => {
    switch (key) {
      //strings
      case "location":
      case "query":
        const str = stringOrFirstString(urlQuery[key]);
        if (str) filters[key] = str;
        break;

      //ints
      case "lastActive":
      case "numGuests":
      case "radius":
        const int = Number.parseInt(stringOrFirstString(urlQuery[key]) || "");
        if (int) filters[key] = int;
        break;

      //floats
      case "lat":
      case "lng":
        const float = Number.parseFloat(
          stringOrFirstString(urlQuery[key]) || ""
        );
        if (float) filters[key] = float;
        break;

      //others
      case "hostingStatusOptions":
        const rawOptions = urlQuery[key];
        const options =
          typeof rawOptions === "string" ? [rawOptions] : rawOptions ?? [];

        filters[key] = options
          .map((o) => Number.parseInt(o))
          .filter((o) => !!o);
        break;

      default:
        console.warn(`Unhandled search parameter ${key} ignored`);
        break;
    }
  });
  return filters;
}

/**
 * Parses a search filter object into a URL encoded search query
 */
export function parseSearchFiltersToQuery(filters: SearchFilters) {
  const entries: [string, string][] = [];
  Object.entries(filters).forEach(([key, filterValue]) => {
    if (Array.isArray(filterValue)) {
      filterValue.forEach((value) => {
        entries.push([key, `${value}`]);
      });
    } else {
      entries.push([key, filterValue]);
    }
  });
  const searchParams = new URLSearchParams(entries);
  return searchParams.toString();
}
