import useUsers from "features/userQueries/useUsers";
import { Error as GrpcError } from "grpc-web";
import { ListEventAttendeesRes } from "proto/events_pb";
import { eventAttendeesKey } from "queryKeys";
import { useInfiniteQuery } from "react-query";
import { service } from "service";

import { ATTENDEES, NO_ATTENDEES } from "./constants";
import EventUsers from "./EventUsers";

interface EventAttendeesProps {
  eventId: number;
}

export default function EventAttendees({ eventId }: EventAttendeesProps) {
  const {
    data,
    error,
    hasNextPage,
    isLoading: isAttendeesIdsLoading,
  } = useInfiniteQuery<ListEventAttendeesRes.AsObject, GrpcError>({
    queryKey: eventAttendeesKey({ eventId, type: "summary" }),
    queryFn: () => service.events.listEventAttendees(eventId),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  const attendeesIds =
    data?.pages.flatMap((data) => data.attendeeUserIdsList) ?? [];
  const { data: attendees, isLoading: isAttendeesLoading } =
    useUsers(attendeesIds);

  return (
    <EventUsers
      emptyState={NO_ATTENDEES}
      error={error}
      hasNextPage={hasNextPage}
      isLoading={isAttendeesIdsLoading || isAttendeesLoading}
      users={attendees}
      userIds={attendeesIds}
      title={ATTENDEES}
    />
  );
}
