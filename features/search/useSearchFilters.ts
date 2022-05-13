import { useRouter } from "next/router";
import { ParsedUrlQuery } from "querystring";
import { useCallback, useEffect, useRef, useState } from "react";
import { UserSearchFilters as ServiceUserSearchFilters } from "service/search";
import stringOrFirstString from "utils/stringOrFirstString";

export interface SearchFilters extends ServiceUserSearchFilters {
  location?: string;
}

export default function useSearchFilters(route: string) {
  const router = useRouter();
  const [active, setActive] = useState<SearchFilters>(() =>
    parsedQueryToFilters(router.query)
  );
  const pending = useRef<SearchFilters>(active);

  const expectedRouteWithQuery = `${route}?${filtersToSearchQuery(active)}`;
  const routerQueryIsReady = router.isReady;
  useEffect(() => {
    if (routerQueryIsReady) {
      router.push(expectedRouteWithQuery);
    }
  }, [expectedRouteWithQuery, routerQueryIsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  // router excluded from deps because instance changes. @see https://github.com/vercel/next.js/issues/18127

  const change = useCallback(
    <T extends keyof SearchFilters>(
      filter: T,
      value: Exclude<SearchFilters[T], undefined>
    ) => {
      pending.current = { ...pending.current, [filter]: value };
    },
    []
  );

  const remove = useCallback((filter: keyof SearchFilters) => {
    delete pending.current[filter];
    //need to copy the object or setState may not cause re-render
    pending.current = { ...pending.current };
  }, []);

  const apply = useCallback(() => {
    setActive(pending.current);
  }, []);

  const clear = useCallback(() => {
    pending.current = {};
  }, []);

  const any = !!(
    active.hostingStatusOptions?.length ||
    active.lastActive ||
    active.location ||
    active.numGuests ||
    active.query
  );

  return { active, change, remove, apply, clear, any };
}

export function parsedQueryToFilters(urlQuery: ParsedUrlQuery) {
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

export function filtersToSearchQuery(filters: SearchFilters) {
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
