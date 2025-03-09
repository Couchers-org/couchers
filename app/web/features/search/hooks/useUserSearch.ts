import { MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "features/search/utils/constants";
import { User } from "proto/api_pb";
import { useState } from "react";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

import { FilterOptions } from "../SearchPage";
import { MapSearchState } from "../state/mapSearchReducers";

export function useUserSearch(
  searchParams: FilterOptions,
  mapSearchState: MapSearchState,
) {
  const [pageNumber, setPageNumber] = useState(0);

  const meetsSearchCriteria =
    mapSearchState.hasActiveFilters ||
    mapSearchState.zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH ||
    mapSearchState.hasSearchInputValue;

  const {
    data,
    hasNextPage,
    isLoading,
    isFetching,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery(
    ["userSearch", searchParams],
    ({ pageParam }) => service.search.userSearch(searchParams, pageParam),
    {
      enabled: meetsSearchCriteria,
      keepPreviousData: meetsSearchCriteria,
      getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    },
  );

  // React-query will keep the previously fetched data in the cache, so return undefined if we don't meet the search criteria
  const users = !meetsSearchCriteria
    ? undefined
    : data?.pages[pageNumber]?.resultsList
        ?.map((result) => result?.user)
        .filter((user): user is User.AsObject => Boolean(user)) || [];

  /** We don't have a previousPageToken on the backend, so for now we deterine
   *  if we have a previous page by checking if the current page is greater than 0
   *  and if the previous page has a nextPageToken.
   */
  const hasPreviousPage =
    (users ?? []).length > 0 &&
    data?.pages[pageNumber - 1]?.nextPageToken !== undefined;

  const totalItems = data?.pages[0]?.totalItems ?? 0;

  return {
    users,
    isLoading: isLoading || isFetching,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    totalItems,
    pageNumber,
    setPageNumber,
  };
}
