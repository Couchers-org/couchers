import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import SearchFilters, {
  parsedQueryToSearchFilters,
  parseSearchFiltersToQuery,
} from "utils/searchFilters";

/**
 * This hook manages a state with search filters and keeps the URL in sync
 */
export default function useRouteWithSearchFilters(route: string) {
  const router = useRouter();
  const [active, setActive] = useState<SearchFilters>(() =>
    parsedQueryToSearchFilters(router.query)
  );
  const pending = useRef<SearchFilters>(active);

  const expectedRouteWithQuery = `${route}?${parseSearchFiltersToQuery(
    active
  )}`;
  const routerQueryIsReady = router.isReady;
  useEffect(() => {
    if (routerQueryIsReady) {
      router.push(expectedRouteWithQuery, expectedRouteWithQuery, {
        shallow: true,
      });
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
