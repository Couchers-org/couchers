import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import {
  Event,
  ListAllEventsRes,
  ListEventAttendeesRes,
  ListEventOrganizersRes,
} from "proto/events_pb";
import {
  eventAttendeesKey,
  eventKey,
  eventOrganizersKey,
  eventsKey,
  QueryType,
} from "queryKeys";
import { useInfiniteQuery, useQuery } from "react-query";
import { useParams } from "react-router-dom";
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
  const query = useInfiniteQuery<ListEventOrganizersRes.AsObject, GrpcError>({
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
  const query = useInfiniteQuery<ListEventAttendeesRes.AsObject, GrpcError>({
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

export function useEvent() {
  const { eventId: rawEventId, eventSlug } =
    useParams<{ eventId: string; eventSlug?: string }>();

  const eventId = +rawEventId;
  const isValidEventId = !isNaN(eventId) && eventId > 0;

  const eventQuery = useQuery<Event.AsObject, GrpcError>({
    queryKey: eventKey(eventId),
    queryFn: () => service.events.getEvent(eventId),
    enabled: isValidEventId,
  });

  return {
    ...eventQuery,
    eventId,
    eventSlug,
    isValidEventId,
  };
}

export function useListAllEvents({
  pastEvents,
  pageSize,
}: Omit<ListAllEventsInput, "pageToken">) {
  return useInfiniteQuery<ListAllEventsRes.AsObject, GrpcError>({
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
