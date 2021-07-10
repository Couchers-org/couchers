import { useState } from "react";

import { NO_ORGANISERS, ORGANISERS } from "./constants";
import EventOrganisersDialog from "./EventOrganisersDialog";
import EventUsers from "./EventUsers";
import { useEventOrganisers } from "./hooks";

interface EventOrganisersProps {
  eventId: number;
}

export default function EventOrganisers({ eventId }: EventOrganisersProps) {
  const {
    error: organiserIdsError,
    hasNextPage,
    isLoading,
    isOrganisersRefetching,
    organiserIds,
    organisers,
  } = useEventOrganisers({ eventId, type: "summary", pageSize: 5 });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <EventUsers
        emptyState={NO_ORGANISERS}
        error={organiserIdsError}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isUsersRefetching={isOrganisersRefetching}
        onSeeAllClick={() => setIsDialogOpen(true)}
        users={organisers}
        userIds={organiserIds}
        title={ORGANISERS}
      />
      <EventOrganisersDialog
        eventId={eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
