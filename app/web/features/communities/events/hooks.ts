import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  eventAttendeesKey,
  eventKey,
  eventOrganizersKey,
  myEventsKey,
  QueryType,
} from "features/queryKeys";
import { RpcError } from "grpc-web";
import {
  Event,
  ListEventAttendeesRes,
  ListEventOrganizersRes,
  ListMyEventsRes,
} from "proto/events_pb";
import { EventSearchRes } from "proto/search_pb";
import { service } from "service";
import type { ListMyEventsInput } from "service/events";
import { GeocodeResult } from "utils/hooks";

interface UseEventUsersInput {
  eventId: number;
  type: QueryType;
  enabled?: boolean;
}

const SUMMARY_QUERY_PAGE_SIZE = 5;

export function useEventOrganizers({
  enabled = true,
  eventId,
  type,
}: UseEventUsersInput) {
  const query = useInfiniteQuery<ListEventOrganizersRes.AsObject, RpcError>({
    queryKey: eventOrganizersKey({ eventId, type }),
    queryFn: ({ pageParam }) =>
      service.events.listEventOrganizers({
        eventId,
        pageSize: type === "summary" ? SUMMARY_QUERY_PAGE_SIZE : undefined,
        pageToken: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
    initialPageParam: undefined,
  });
  const organizerIds = query.data?.pages.flatMap(
    (res) => res.organizerUserIdsList,
  );

  return { ...query, organizerIds };
}

export function useEventAttendees({
  enabled = true,
  eventId,
  type,
}: UseEventUsersInput) {
  const query = useInfiniteQuery<ListEventAttendeesRes.AsObject, RpcError>({
    queryKey: eventAttendeesKey({ eventId, type }),
    queryFn: ({ pageParam }) =>
      service.events.listEventAttendees({
        eventId,
        pageSize: type === "summary" ? SUMMARY_QUERY_PAGE_SIZE : undefined,
        pageToken: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
    initialPageParam: undefined,
  });
  const attendeesIds = query.data?.pages.flatMap(
    (data) => data.attendeeUserIdsList,
  );
  return {
    ...query,
    attendeesIds,
  };
}

export function useEvent({
  eventId,
  enabled,
}: {
  eventId: number;
  enabled?: boolean;
}) {
  const isValidEventId = eventId > 0;

  const eventQuery = useQuery<Event.AsObject, RpcError>({
    queryKey: eventKey(eventId),
    queryFn: () => service.events.getEvent(eventId),
    enabled: enabled !== undefined ? enabled && isValidEventId : isValidEventId,
  });

  return {
    ...eventQuery,
    eventId,
    isValidEventId,
  };
}

export function useListMyEvents({
  myCommunitiesExcludeGlobal,
  pastEvents,
  pageNumber,
  pageSize,
  showCancelled,
}: Omit<ListMyEventsInput, "pageToken">) {
  return useQuery<ListMyEventsRes.AsObject, RpcError>({
    queryKey: [
      myEventsKey(pastEvents ? "past" : "upcoming"),
      pageNumber,
      showCancelled,
    ],
    queryFn: ({ pageParam }) =>
      service.events.listMyEvents({
        myCommunitiesExcludeGlobal,
        pastEvents,
        pageNumber,
        pageSize,
        pageToken: pageParam as string | undefined,
        showCancelled,
      }),
  });
}

export function useEventSearch({
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
  searchLocation?: GeocodeResult | "";
  attending?: boolean;
  organizing?: boolean;
}) {
  return useQuery<EventSearchRes.AsObject, RpcError>({
    queryKey: [
      "searchEvents",
      isMyCommunities,
      isOnlineOnly,
      pageNumber,
      pastEvents,
      searchLocation,
    ],
    queryFn: () =>
      service.search.EventSearch({
        pageNumber,
        pageSize,
        pastEvents,
        isMyCommunities,
        isOnlineOnly,
        searchLocation,
      }),
  });
}
