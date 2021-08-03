import { useState } from "react";

import { ATTENDEES, NO_ATTENDEES } from "./constants";
import EventAttendeesDialog from "./EventAttendeesDialog";
import EventUsers from "./EventUsers";
import { useEventAttendees } from "./hooks";

interface EventAttendeesProps {
  eventId: number;
}

export default function EventAttendees({ eventId }: EventAttendeesProps) {
  const {
    attendees,
    attendeesIds,
    error,
    isLoading,
    isAttendeesRefetching,
    hasNextPage,
  } = useEventAttendees({ eventId, type: "summary" });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <>
      <EventUsers
        emptyState={NO_ATTENDEES}
        error={error}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isUsersRefetching={isAttendeesRefetching}
        onSeeAllClick={() => setIsDialogOpen(true)}
        users={attendees}
        userIds={attendeesIds}
        title={ATTENDEES}
      />
      <EventAttendeesDialog
        eventId={eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
