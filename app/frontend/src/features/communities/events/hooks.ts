import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { ListEventAttendeesRes, ListEventOrganizersRes } from "proto/events_pb";
import { eventAttendeesKey, eventOrganisersKey, QueryType } from "queryKeys";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

export interface UseEventUsersInput {
  eventId: number;
  type: QueryType;
  pageSize?: number;
}

export function useEventOrganisers({
  eventId,
  pageSize,
  type,
}: UseEventUsersInput) {
  const query = useInfiniteQuery<ListEventOrganizersRes.AsObject, GrpcError>({
    queryKey: eventOrganisersKey({ eventId, type }),
    queryFn: () => service.events.listEventOrganisers({ eventId, pageSize }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
  const organiserIds =
    query.data?.pages.flatMap((res) => res.organizerUserIdsList) ?? [];
  const { data: organisers, isLoading: isOrganisersLoading } =
    useUsers(organiserIds);

  return {
    ...query,
    organiserIds,
    organisers,
    isLoading: query.isLoading || isOrganisersLoading,
  };
}

export function useEventAttendees({
  eventId,
  pageSize,
  type,
}: UseEventUsersInput) {
  const query = useInfiniteQuery<ListEventAttendeesRes.AsObject, GrpcError>({
    queryKey: eventAttendeesKey({ eventId, type }),
    queryFn: () => service.events.listEventAttendees({ eventId, pageSize }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });
  const attendeesIds =
    query.data?.pages.flatMap((data) => data.attendeeUserIdsList) ?? [];
  const { data: attendees, isLoading: isAttendeesLoading } =
    useUsers(attendeesIds);

  return {
    ...query,
    attendeesIds,
    attendees,
    isLoading: query.isLoading || isAttendeesLoading,
  };
}
