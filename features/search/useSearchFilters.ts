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
    history.push(`${route}?${filtersToSearchQuery(active)}`);
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
