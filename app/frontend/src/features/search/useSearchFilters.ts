import { Location } from "history";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { UserSearchFilters as ServiceUserSearchFilters } from "service/search";

export interface SearchFilters extends ServiceUserSearchFilters {
  location?: string;
}

export default function useSearchFilters(route: string) {
  const location = useLocation();
  const [active, setActive] = useState<SearchFilters>(() =>
    locationToFilters(location)
  );
  const pending = useRef<SearchFilters>(active);

  const history = useHistory();

  useEffect(() => {
    const entries: [string, string][] = [];
    Object.entries(active).forEach(([key, filterValue]) => {
      if (Array.isArray(filterValue)) {
        filterValue.forEach((value) => {
          entries.push([key, `${value}`]);
        });
      } else {
        entries.push([key, filterValue]);
      }
    });
    const searchParams = new URLSearchParams(entries);
    history.push(`${route}?${searchParams.toString()}`);
  }, [active, history, route]);

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
  }, []);

  const apply = useCallback(() => {
    setActive(pending.current);
  }, []);

  return { active, change, remove, apply };
}

export function locationToFilters(location: Location) {
  const searchParams = new URLSearchParams(location.search);
  const filters: SearchFilters = {};
  Array.from(searchParams.keys()).forEach((key) => {
    switch (key) {
      //strings
      case "location":
      case "query":
        const str = searchParams.get(key);
        if (str) filters[key] = str;
        break;

      //inta
      case "lastActive":
      case "numGuests":
      case "radius":
        const int = Number.parseInt(searchParams.get(key) || "");
        if (int) filters[key] = int;
        break;

      //floats
      case "lat":
      case "lng":
        const float = Number.parseFloat(searchParams.get(key) || "");
        if (float) filters[key] = float;
        break;

      //others
      case "hostingStatusOptions":
        const options = searchParams.getAll(key);
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
