import { UserSearchRes } from "proto/search_pb";
import { service } from "service";
import { useInfiniteQuery } from "react-query";
import { GeocodeResult } from "utils/hooks";

type useMapSearchProps = {
  queryName: string,
  locationResult: GeocodeResult,
  lastActiveFilter: number,
  hostingStatusFilter: number,
  numberOfGuestFilter: number,
  completeProfileFilter: boolean,
}

export function useMapSearch({queryName, locationResult, lastActiveFilter, hostingStatusFilter, numberOfGuestFilter, completeProfileFilter}: useMapSearchProps) {

  return useInfiniteQuery<
    UserSearchRes.AsObject,
    Error
  >(
    [
      "userSearch",
      queryName,
      locationResult?.name,
      locationResult?.bbox,
      lastActiveFilter,
      hostingStatusFilter,
      numberOfGuestFilter,
      completeProfileFilter,
    ],
    ({ pageParam }) => {
      // @ts-ignore @TODO David fixing these in a separate PR
      const lastActiveComparation = parseInt(lastActiveFilter);
      // @ts-ignore @TODO David fixing these in a separate PR
      const hostingStatusFilterComparation = parseInt(hostingStatusFilter);

      return service.search.userSearch(
        {
          query: queryName,
          bbox: locationResult.bbox,
          lastActive:
            lastActiveComparation === 0 ? undefined : lastActiveFilter,
          hostingStatusOptions:
            hostingStatusFilterComparation === 0
              ? undefined
              : [hostingStatusFilter],
          numGuests:
            numberOfGuestFilter === 0 ? undefined : numberOfGuestFilter,
          completeProfile:
            completeProfileFilter === false ? undefined : completeProfileFilter,
        },
        pageParam
      );
    },
    {
      getNextPageParam: (lastPage) =>
        lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    }
  )
}