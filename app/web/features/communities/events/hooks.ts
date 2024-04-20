import {
  eventAttendeesKey,
  eventKey,
  eventOrganizersKey,
  eventsKey,
  QueryType,
} from "features/queryKeys";
import useUsers from "features/userQueries/useUsers";
import { RpcError } from "grpc-web";
import {
  Event,
  ListAllEventsRes,
  ListEventAttendeesRes,
  ListEventOrganizersRes,
} from "proto/events_pb";
import { useInfiniteQuery, useQuery } from "react-query";
import { service } from "service";
import type { ListAllEventsInput } from "service/events";

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
}: Omit<ListAllEventsInput, "pageToken">) {
  return useInfiniteQuery<ListAllEventsRes.AsObject, RpcError>({
    queryKey: eventsKey(pastEvents ? "past" : "upcoming"),
    queryFn: ({ pageParam }) =>
      service.events.listAllEvents({
        pastEvents,
        pageSize,
        pageToken: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
}
