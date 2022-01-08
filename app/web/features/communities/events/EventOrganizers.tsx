import { useState } from "react";

import { NO_ORGANIZERS, ORGANIZERS } from "./constants";
import EventOrganizersDialog from "./EventOrganizersDialog";
import EventUsers from "./EventUsers";
import { useEventOrganizers } from "./hooks";

interface EventOrganizersProps {
  eventId: number;
}

export default function EventOrganizers({ eventId }: EventOrganizersProps) {
  const {
    error: organizerIdsError,
    hasNextPage,
    isLoading,
    isOrganizersRefetching,
    organizerIds,
    organizers,
  } = useEventOrganizers({ eventId, type: "summary" });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <EventUsers
        emptyState={NO_ORGANIZERS}
        error={organizerIdsError}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isUsersRefetching={isOrganizersRefetching}
        onSeeAllClick={() => setIsDialogOpen(true)}
        users={organizers}
        userIds={organizerIds}
        title={ORGANIZERS}
      />
      <EventOrganizersDialog
        eventId={eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
