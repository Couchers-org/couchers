import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useState } from "react";

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
  const { t } = useTranslation([COMMUNITIES]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <>
      <EventUsers
        emptyState={t("communities:no_attendees")}
        error={error}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isUsersRefetching={isAttendeesRefetching}
        onSeeAllClick={() => setIsDialogOpen(true)}
        users={attendees}
        userIds={attendeesIds}
        title={t("communities:attendees")}
      />
      <EventAttendeesDialog
        eventId={eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
