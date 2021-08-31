import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import {
  Event,
  ListEventAttendeesRes,
  ListEventOrganizersRes,
} from "proto/events_pb";
import {
  eventAttendeesKey,
  eventKey,
  eventOrganisersKey,
  QueryType,
} from "queryKeys";
import { useInfiniteQuery, useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { service } from "service";

export interface UseEventUsersInput {
  eventId: number;
  type: QueryType;
  enabled?: boolean;
}

export const SUMMARY_QUERY_PAGE_SIZE = 5;

export function useEventOrganisers({
  enabled = true,
  eventId,
  type,
}: UseEventUsersInput) {
  const query = useInfiniteQuery<ListEventOrganizersRes.AsObject, GrpcError>({
    queryKey: eventOrganisersKey({ eventId, type }),
    queryFn: ({ pageParam }) =>
      service.events.listEventOrganisers({
        eventId,
        pageSize: type === "summary" ? SUMMARY_QUERY_PAGE_SIZE : undefined,
        pageToken: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    enabled,
  });
  const organiserIds =
    query.data?.pages.flatMap((res) => res.organizerUserIdsList) ?? [];
  const {
    data: organisers,
    isLoading: isOrganisersLoading,
    isRefetching: isOrganisersRefetching,
  } = useUsers(organiserIds);

  return {
    ...query,
    organiserIds,
    organisers,
    isOrganisersLoading,
    isOrganisersRefetching,
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
