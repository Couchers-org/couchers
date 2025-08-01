import { Remove } from "@mui/icons-material";
import RemoveAsCoOrganizerDialog from "features/communities/events/RemoveAsCoOrganizerDialog";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { useState } from "react";

import EventOrganizersDialog from "./EventOrganizersDialog";
import EventUsers from "./EventUsers";
import { useEvent, useEventOrganizers } from "./hooks";

interface EventOrganizersProps {
  eventId: number;
}

export default function EventOrganizers({ eventId }: EventOrganizersProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const {
    error: organizerIdsError,
    hasNextPage,
    organizerIds,
  } = useEventOrganizers({ eventId, type: "summary" });

  const event = useEvent({
    eventId: eventId,
  });

  const currentUser = useCurrentUser();

  const isCreatedByCurrentUser =
    currentUser.data?.userId === event.data?.creatorUserId;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [coOrganizerRemoveUser, setCoOrganizerRemoveUser] = useState<
    undefined | LiteUser.AsObject
  >();

  const [isCoOrganizerDialogOpen, setIsCoOrganizerDialogOpen] = useState(false);

  // Organizers can remove themselves, creator can remove organizers
  const canBeRemovedByCurrentUser = (user: LiteUser.AsObject) =>
    (isCreatedByCurrentUser && currentUser.data?.userId !== user.userId) ||
    (!isCreatedByCurrentUser && currentUser.data?.userId === user.userId);

  return (
    <>
      <EventUsers
        emptyState={t("communities:no_organizers")}
        error={organizerIdsError}
        hasNextPage={hasNextPage}
        onSeeAllClick={() => setIsDialogOpen(true)}
        userIds={organizerIds}
        title={t("communities:organizers")}
        getUserMenuOptions={(user) =>
          canBeRemovedByCurrentUser(user)
            ? [
                {
                  icon: <Remove fontSize="small" />,
                  onClick: () => {
                    setCoOrganizerRemoveUser(user);
                    setIsCoOrganizerDialogOpen(true);
                  },
                  title: t("communities:remove_as_co_organizer:title"),
                },
              ]
            : undefined
        }
      />
      <EventOrganizersDialog
        eventId={eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <RemoveAsCoOrganizerDialog
        username={coOrganizerRemoveUser?.name ?? ""}
        eventName={event.data?.title ?? ""}
        open={isCoOrganizerDialogOpen}
        onClose={() => setIsCoOrganizerDialogOpen(false)}
        onSubmit={() => {
          // @TODO(FB): Actually remove co-organizer
          setIsCoOrganizerDialogOpen(false);
        }}
      />
    </>
  );
}
