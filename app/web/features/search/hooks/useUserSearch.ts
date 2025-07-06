import { useInfiniteQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { UserSearchV2Res } from "proto/search_pb";
import { service } from "service";

import { FilterOptions } from "../SearchPage";
import { MapSearchState } from "../state/mapSearchReducers";

const calculateCurrentNumberOfTotal = ({
  pageNumber,
  currentPageNumItems,
}: {
  pageNumber: number;
  currentPageNumItems: number;
}) => {
  if (pageNumber === 1) {
    return currentPageNumItems;
  }

  // each page is 100 items plus current page number of items
  return (pageNumber - 1) * 100 + currentPageNumItems;
};

export function useUserSearch(
  searchParams: FilterOptions,
  mapSearchState: MapSearchState,
) {
  const meetsSearchCriteria =
    mapSearchState.hasActiveFilters ||
    mapSearchState.search.bbox !== undefined ||
    mapSearchState.search.query !== undefined ||
    mapSearchState.shouldSearchByUserId;

  const {
    error,
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    fetchPreviousPage,
  } = useInfiniteQuery<UserSearchV2Res.AsObject, RpcError>(
    ["userSearch", searchParams],
    ({ pageParam }) => service.search.userSearchV2(searchParams, pageParam),
    {
      enabled: meetsSearchCriteria,
      keepPreviousData: meetsSearchCriteria,
      getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    },
  );

  // React-query will keep the previously fetched data in the cache, so return undefined if we don't meet the search criteria
  const users = !meetsSearchCriteria
    ? undefined
    : data?.pages[mapSearchState.pageNumber - 1]?.resultsList || [];

  /** We don't have a previousPageToken on the backend, so for now we deterine
   *  if we have a previous page by checking if the current page is greater than 0
   *  and if the previous page has a nextPageToken.
   */
  const hasPreviousPage =
    (users ?? []).length > 0 &&
    data?.pages[mapSearchState.pageNumber - 2] !== undefined;

  const hasNextPage =
    (users ?? []).length > 0 &&
    data?.pages[mapSearchState.pageNumber - 1]?.nextPageToken !== "";

  const totalItems = data?.pages[0]?.totalItems ?? 0;

  const currentPageNumItems =
    data?.pages[mapSearchState.pageNumber - 1]?.resultsList?.length ?? 0;

  const numberOfTotal = calculateCurrentNumberOfTotal({
    pageNumber: mapSearchState.pageNumber,
    currentPageNumItems,
  });

  return {
    error,
    users,
    isLoading: isLoading || isFetching,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    numberOfTotal,
    totalItems,
  };
}
