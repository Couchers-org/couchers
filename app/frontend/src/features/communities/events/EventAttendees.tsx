import { ATTENDEES, NO_ATTENDEES } from "./constants";
import EventUsers from "./EventUsers";
import { useEventAttendees } from "./hooks";

interface EventAttendeesProps {
  eventId: number;
}

export default function EventAttendees({ eventId }: EventAttendeesProps) {
  const { attendees, attendeesIds, error, isLoading, hasNextPage } =
    useEventAttendees({ eventId, type: "summary" });

  return (
    <EventUsers
      emptyState={NO_ATTENDEES}
      error={error}
      hasNextPage={hasNextPage}
      isLoading={isLoading}
      users={attendees}
      userIds={attendeesIds}
      title={ATTENDEES}
    />
  );
}
