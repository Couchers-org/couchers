import { MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "features/search/utils/constants";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

import { MapSearchState } from "../mapSearchReducers";
import { FilterOptions } from "../SearchPage";

export function useUserSearch(searchParams: FilterOptions, mapSearchState: MapSearchState, zoom: number) {
  return useInfiniteQuery(
    ["userSearch", searchParams],
    ({ pageParam }) => service.search.userSearch(searchParams, pageParam),
    {
      enabled: mapSearchState.hasActiveFilters || zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH || mapSearchState.hasSearchInputValue,
      keepPreviousData: true,
      getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    }
  );
}
