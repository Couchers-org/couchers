import {
  eventAttendeesKey,
  eventKey,
  eventOrganizersKey,
  eventsKey,
  myEventsKey,
  QueryType,
} from "features/queryKeys";
import useUsers from "features/userQueries/useUsers";
import { RpcError } from "grpc-web";
import { LngLat } from "maplibre-gl";
import {
  Event,
  ListAllEventsRes,
  ListEventAttendeesRes,
  ListEventOrganizersRes,
  ListMyEventsRes,
} from "proto/events_pb";
import { EventSearchRes } from "proto/search_pb";
import { useInfiniteQuery, useQuery } from "react-query";
import { service } from "service";
import type { ListAllEventsInput, ListMyEventsInput } from "service/events";

export interface UseEventUsersInput {
  eventId: number;
  type: QueryType;
  enabled?: boolean;
}

export const SUMMARY_QUERY_PAGE_SIZE = 5;

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
        pageToken: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
  });
  const organizerIds =
    query.data?.pages.flatMap((res) => res.organizerUserIdsList) ?? [];
  const {
    data: organizers,
    isLoading: isOrganizersLoading,
    isRefetching: isOrganizersRefetching,
  } = useUsers(organizerIds);

  return {
    ...query,
    organizerIds,
    organizers,
    isOrganizersLoading,
    isOrganizersRefetching,
  };
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
        pageToken: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
  });
  const attendeesIds =
    query.data?.pages.flatMap((data) => data.attendeeUserIdsList) ?? [];
  const {
    data: attendees,
    isLoading: isAttendeesLoading,
    isRefetching: isAttendeesRefetching,
  } = useUsers(attendeesIds);

  return {
    ...query,
    attendeesIds,
    attendees,
    isAttendeesLoading,
    isAttendeesRefetching,
  };
}

export function useEvent({ eventId }: { eventId: number }) {
  const isValidEventId = eventId > 0;

  const eventQuery = useQuery<Event.AsObject, RpcError>({
    queryKey: eventKey(eventId),
    queryFn: () => service.events.getEvent(eventId),
    enabled: isValidEventId,
  });

  return {
    ...eventQuery,
    eventId,
    isValidEventId,
  };
}

export function useListAllEvents({
  pastEvents,
  pageSize,
  showCancelled,
}: Omit<ListAllEventsInput, "pageToken">) {
  return useInfiniteQuery<ListAllEventsRes.AsObject, RpcError>({
    queryKey: [eventsKey(pastEvents ? "past" : "upcoming"), showCancelled],
    queryFn: ({ pageParam }) =>
      service.events.listAllEvents({
        pastEvents,
        pageSize,
        pageToken: pageParam,
        showCancelled,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
}

export function useListMyEvents({
  pastEvents,
  pageSize,
  showCancelled,
}: Omit<ListMyEventsInput, "pageToken">) {
  return useInfiniteQuery<ListMyEventsRes.AsObject, RpcError>({
    queryKey: [myEventsKey(pastEvents ? "past" : "upcoming"), showCancelled],
    queryFn: ({ pageParam }) =>
      service.events.listMyEvents({
        pastEvents,
        pageSize,
        pageToken: pageParam,
        showCancelled,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
}

export function useEventSearch({
  query,
  pageSize,
  pastEvents,
  isMyCommunities,
  isOnlineOnly,
  nearMeLocation,
  showCancelled,
}: {
  query?: string;
  pageSize: number;
  pastEvents?: boolean;
  isMyCommunities?: boolean;
  isOnlineOnly?: boolean;
  nearMeLocation?: LngLat | undefined;
  showCancelled?: boolean;
}) {
  return useInfiniteQuery<EventSearchRes.AsObject, RpcError>({
    queryKey: [
      "searchEvents",
      query,
      isMyCommunities,
      isOnlineOnly,
      nearMeLocation,
      pastEvents,
      showCancelled,
    ],
    queryFn: ({ pageParam }) =>
      service.search.EventSearch({
        query,
        pageSize,
        pageToken: pageParam,
        pastEvents,
        isMyCommunities,
        isOnlineOnly,
        nearMeLocation,
        showCancelled,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
}
