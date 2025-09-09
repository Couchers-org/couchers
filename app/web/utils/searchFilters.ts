import { ParsedUrlQuery } from "querystring";

import { Coordinates } from "@/features/search/utils/constants";
import log from "@/log";
import { UserSearchFilters as ServiceUserSearchFilters } from "@/service/search";
import stringOrFirstString from "@/utils/stringOrFirstString";

export interface SearchFilters extends ServiceUserSearchFilters {
  location?: string;
}

/**
 * Parses a URL search query into an object with all the search filter properties found
 */
export const parsedQueryToSearchFilters = (urlQuery: ParsedUrlQuery) => {
  const filters: SearchFilters = {};
  Array.from(Object.keys(urlQuery)).forEach((key) => {
    switch (key) {
      // strings
      case "location":
      case "query":
        {
          const str = stringOrFirstString(urlQuery[key]);
          if (str) filters[key] = str;
        }
        break;

      // ints
      case "lastActive":
      case "numGuests":
        {
          const int = Number.parseInt(stringOrFirstString(urlQuery[key]) || "");
          if (int) filters[key] = int;
        }
        break;

      case "bbox":
        {
          const list = urlQuery[key] || [];
          if (list && list.length && Array.isArray(list)) {
            const parsedList = list.map((value) => Number.parseFloat(value));

            if (parsedList.length === 4) {
              filters[key] = parsedList as Coordinates;
            }
          }
        }
        break;

      // others
      case "hostingStatus":
        {
          const rawOptions = urlQuery[key];
          const options =
            typeof rawOptions === "string" ? [rawOptions] : (rawOptions ?? []);

          filters[key] = options
            .map((o) => Number.parseInt(o))
            .filter((o) => !!o);
        }
        break;

      default:
        log.warn(`Unhandled search parameter ${key} ignored`);
        break;
    }
  });
  return filters;
};

/**
 * Parses a search filter object into a URL encoded search query
 */
export const parseSearchFiltersToQuery = (filters: SearchFilters) => {
  const entries: [string, string][] = [];
  (Object.entries(filters) as Array<[string, keyof typeof filters]>).forEach(
    ([key, filterValue]) => {
      if (Array.isArray(filterValue)) {
        filterValue.forEach((value: string | number) => {
          entries.push([key, `${value}`]);
        });
      } else {
        entries.push([key, filterValue]);
      }
    },
  );
  const searchParams = new URLSearchParams(entries);
  return searchParams.toString();
};
