import { MAX_MAP_ZOOM_LEVEL_FOR_SEARCH } from "features/search/utils/constants";
import { User } from "proto/api_pb";
import { useMemo, useState } from "react";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

import { FilterOptions } from "../SearchPage";
import { MapSearchState } from "../state/mapSearchReducers";

export function useUserSearch(
  searchParams: FilterOptions,
  mapSearchState: MapSearchState,
  zoom: number,
) {
  const [pageNumber, setPageNumber] = useState(0);

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
      enabled:
        mapSearchState.hasActiveFilters ||
        zoom >= MAX_MAP_ZOOM_LEVEL_FOR_SEARCH ||
        mapSearchState.hasSearchInputValue,
      keepPreviousData: true,
      getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    },
  );

  const users = useMemo(
    () =>
      data?.pages[pageNumber]?.resultsList
        ?.map((result) => result?.user)
        .filter((user): user is User.AsObject => Boolean(user)) || [],
    [data, pageNumber], // Only recompute if `data` or `pageNumber` changes
  );

  /** We don't have a previousPageToken on the backend, so for now we deterine
   *  if we have a previous page by checking if the current page is greater than 0
   *  and if the previous page has a nextPageToken.
   */
  const hasPreviousPage = useMemo(
    () =>
      users.length > 0 &&
      data?.pages[pageNumber - 1]?.nextPageToken !== undefined,
    [data?.pages, users.length, pageNumber],
  );
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
