import { create } from "@bufbuild/protobuf";
import { Events, Search } from "@couchers/services";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { RpcError } from "grpc-web";

import {
  QueryType,
  eventAttendeesKey,
  eventKey,
  eventOrganizersKey,
  eventsKey,
  myEventsKey,
} from "@/features/queryKeys";
import serviceClients from "@/serviceClients";
import { GeocodeResult } from "@/utils/hooks";

export interface UseEventUsersInput {
  eventId: bigint;
  type: QueryType;
  enabled?: boolean;
}

export const SUMMARY_QUERY_PAGE_SIZE = 5;

export const useEventOrganizers = ({
  enabled = true,
  eventId,
  type,
}: UseEventUsersInput) => {
  const query = useInfiniteQuery<Events.ListEventOrganizersRes, RpcError>({
    queryKey: eventOrganizersKey({ eventId, type }),
    queryFn: ({ pageParam }) =>
      serviceClients.events.listEventOrganizers({
        eventId,
        pageSize: type === "summary" ? SUMMARY_QUERY_PAGE_SIZE : undefined,
        pageToken: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
    initialPageParam: undefined,
  });
  const organizerIds = query.data?.pages.flatMap((res) => res.organizerUserIds);

  return { ...query, organizerIds };
};

export const useEventAttendees = ({
  enabled = true,
  eventId,
  type,
}: UseEventUsersInput) => {
  const query = useInfiniteQuery<Events.ListEventAttendeesRes, RpcError>({
    queryKey: eventAttendeesKey({ eventId, type }),
    queryFn: ({ pageParam }) =>
      serviceClients.events.listEventAttendees({
        eventId,
        pageSize: type === "summary" ? SUMMARY_QUERY_PAGE_SIZE : undefined,
        pageToken: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
    initialPageParam: undefined,
  });
  const attendeesIds = query.data?.pages.flatMap(
    (data) => data.attendeeUserIds,
  );
  return {
    ...query,
    attendeesIds,
  };
};

export const useEvent = ({ eventId }: { eventId: bigint }) => {
  const isValidEventId = eventId > 0;

  const eventQuery = useQuery<Events.Event, RpcError>({
    queryKey: eventKey(eventId),
    queryFn: () => serviceClients.events.getEvent({ eventId }),
    enabled: isValidEventId,
  });

  return {
    ...eventQuery,
    eventId,
    isValidEventId,
  };
};

export const useListAllEvents = (
  params: Omit<Events.ListAllEventsReq, "pageToken">,
) => {
  return useInfiniteQuery<Events.ListAllEventsRes, RpcError>({
    queryKey: [
      eventsKey(params.past ? "past" : "upcoming"),
      params.includeCancelled,
    ],
    queryFn: ({ pageParam }) =>
      serviceClients.events.listAllEvents({
        ...params,
        pageToken: pageParam as string,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    initialPageParam: undefined,
  });
};

export const useListMyEvents = (
  params: Omit<Events.ListMyEventsReq, "pageToken">,
) => {
  return useQuery<Events.ListMyEventsRes, RpcError>({
    queryKey: [
      myEventsKey(params.past ? "past" : "upcoming"),
      params.pagination.case === "pageNumber" ? params.pagination.value : 0,
      params.includeCancelled,
    ],

    queryFn: ({ pageParam }) => {
      if (pageParam) {
        return serviceClients.events.listMyEvents({
          ...params,
          pagination: {
            case: "pageToken",
            value: pageParam as string,
          },
        });
      }

      return serviceClients.events.listMyEvents(params);
    },
  });
};

export const useEventSearch = ({
  pageNumber,
  pageSize,
  pastEvents,
  isMyCommunities,
  isOnlineOnly,
  searchLocation,
}: {
  pageNumber: number;
  pageSize: number;
  pastEvents?: boolean;
  isMyCommunities?: boolean;
  isOnlineOnly?: boolean;
  searchLocation: GeocodeResult | "";
}) => {
  return useQuery<Search.EventSearchRes, RpcError>({
    queryKey: [
      "searchEvents",
      isMyCommunities,
      isOnlineOnly,
      pageNumber,
      pastEvents,
      searchLocation,
    ],
    queryFn: () => {
      const request = create(Search.EventSearchReqSchema, {
        pagination: {
          case: "pageNumber",
          value: pageNumber,
        },
        pageSize,
        past: pastEvents,
        myCommunities: isMyCommunities,
        onlineStatus: {
          case: isOnlineOnly ? "onlyOnline" : "onlyOffline",
          value: true,
        },
      }) as Search.EventSearchReqValid;

      if (searchLocation) {
        // If it's a region (i.e. "France" or "United States") use query search by name
        // This will search for events in the region by that name
        if (searchLocation.isRegion) {
          request.query = searchLocation.name;
        } else {
          // Otherwise use rectangle search so we get the area around a city
          // This is because if you search a small town, you might want to search around it too
          request.searchIn = {
            case: "searchInRectangle",
            value: create(Search.RectAreaSchema, {
              latMin: searchLocation.bbox[1] || 0,
              latMax: searchLocation.bbox[3] || 0,
              lngMin: searchLocation.bbox[0] || 0,
              lngMax: searchLocation.bbox[2] || 0,
            }) as Search.RectArea,
          };
        }
      }

      return serviceClients.search.eventSearch(request);
    },
  });
};
