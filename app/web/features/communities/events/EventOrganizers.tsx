import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useState } from "react";

import EventOrganizersDialog from "./EventOrganizersDialog";
import EventUsers from "./EventUsers";
import { useEventOrganizers } from "./hooks";

interface EventOrganizersProps {
  eventId: number;
}

export default function EventOrganizers({ eventId }: EventOrganizersProps) {
  const { t } = useTranslation([COMMUNITIES]);
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
        emptyState={t("communities:no_organizers")}
        error={organizerIdsError}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isUsersRefetching={isOrganizersRefetching}
        onSeeAllClick={() => setIsDialogOpen(true)}
        users={organizers}
        userIds={organizerIds}
        title={t("communities:organizers")}
      />
      <EventOrganizersDialog
        eventId={eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
