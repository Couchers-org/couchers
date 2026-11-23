import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { makeSearchQueryId } from "features/analytics/searchAttribution";
import { RpcError } from "grpc-web";
import { UserSearchV2Res } from "proto/search_pb";
import { useRef } from "react";
import { service } from "service";

import { FilterOptions } from "../SearchPage";
import { MapSearchState } from "../state/mapSearchReducers";

export interface ResultsRange {
  firstResultNumber: number;
  lastResultNumber: number;
}

const PAGE_SIZE = 100;

const calculateCurrentRange = ({
  pageNumber,
  totalFilteredItems,
}: {
  pageNumber: number;
  totalFilteredItems: number;
}): ResultsRange => ({
  firstResultNumber: (pageNumber - 1) * PAGE_SIZE + 1,
  lastResultNumber: Math.min(pageNumber * PAGE_SIZE, totalFilteredItems),
});

export function useUserSearch(searchParams: FilterOptions, mapSearchState: MapSearchState) {
  const meetsSearchCriteria =
    mapSearchState.hasActiveFilters ||
    mapSearchState.search.bbox !== undefined ||
    mapSearchState.search.query !== undefined ||
    mapSearchState.shouldSearchByUserId;

  const { error, data, isLoading, isFetching, fetchNextPage, fetchPreviousPage } = useInfiniteQuery<
    UserSearchV2Res.AsObject,
    RpcError
  >({
    queryKey: ["userSearch", searchParams],
    queryFn: ({ pageParam }) => service.search.userSearchV2(searchParams, pageParam as string | undefined),
    initialPageParam: mapSearchState.pageNumber > 1,
    placeholderData: keepPreviousData,
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled: meetsSearchCriteria,
  });

  // React-query will keep the previously fetched data in the cache, so return undefined if we don't meet the search criteria
  const users = !meetsSearchCriteria ? undefined : data?.pages[mapSearchState.pageNumber - 1]?.resultsList || [];

  /** We don't have a previousPageToken on the backend, so for now we deterine
   *  if we have a previous page by checking if the current page is greater than 0
   *  and if the previous page has a nextPageToken.
   */
  const hasPreviousPage = (users ?? []).length > 0 && data?.pages[mapSearchState.pageNumber - 2] !== undefined;

  const hasNextPage = (users ?? []).length > 0 && data?.pages[mapSearchState.pageNumber - 1]?.nextPageToken !== "";

  const totalFilteredItems = data?.pages[0]?.totalItems ?? 0;
  // everyone in the area before filters; 0 when the backend can't count it (e.g. keyword searches)
  const totalUnfilteredItems = data?.pages[0]?.totalUnfilteredItems ?? 0;

  const currentRange = calculateCurrentRange({ pageNumber: mapSearchState.pageNumber, totalFilteredItems });

  // Rolls when filters/bbox/query change, stays put across pagination within
  // the same intent. searchParams keeps a stable reference across pagination.
  const searchQueryIdRef = useRef<string | null>(null);
  const prevSearchParamsRef = useRef<FilterOptions | null>(null);
  if (searchQueryIdRef.current === null || prevSearchParamsRef.current !== searchParams) {
    prevSearchParamsRef.current = searchParams;
    searchQueryIdRef.current = makeSearchQueryId();
  }
  const searchQueryId = searchQueryIdRef.current;

  return {
    error,
    users,
    isLoading: isLoading || isFetching,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    currentRange,
    totalFilteredItems,
    totalUnfilteredItems,
    searchQueryId,
  };
}
