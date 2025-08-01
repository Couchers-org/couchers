import { Add } from "@mui/icons-material";
import MakeCoOrganizerDialog from "features/communities/events/MakeCoOrganizerDialog";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { useMemo, useState } from "react";

import EventAttendeesDialog from "./EventAttendeesDialog";
import EventUsers from "./EventUsers";
import { useEvent, useEventAttendees, useEventOrganizers } from "./hooks";

interface EventAttendeesProps {
  eventId: number;
}

export default function EventAttendees({ eventId }: EventAttendeesProps) {
  const { attendeesIds, error, hasNextPage } = useEventAttendees({
    eventId,
    type: "summary",
  });

  const event = useEvent({ eventId });

  const { organizerIds } = useEventOrganizers({
    eventId: eventId,
    type: "all",
  });

  const currentUser = useCurrentUser();

  const isCoOrganizedByCurrentUser = useMemo(
    () =>
      organizerIds?.find(
        (organizerId) => organizerId === currentUser.data?.userId,
      ) !== undefined,
    [organizerIds, currentUser.data?.userId],
  );

  const { t } = useTranslation([COMMUNITIES]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [coOrganizerAddUser, setCoOrganizerAddUser] = useState<
    undefined | LiteUser.AsObject
  >();

  const [isCoOrganizerDialogOpen, setIsCoOrganizerDialogOpen] = useState(false);

  return (
    <>
      <EventUsers
        emptyState={t("communities:no_attendees")}
        error={error}
        hasNextPage={hasNextPage}
        onSeeAllClick={() => setIsDialogOpen(true)}
        userIds={attendeesIds}
        title={t("communities:attendees")}
        getUserMenuOptions={
          isCoOrganizedByCurrentUser
            ? (user) =>
                currentUser.data?.userId !== user.userId
                  ? [
                      {
                        icon: <Add fontSize="small" />,
                        onClick: () => {
                          setCoOrganizerAddUser(user);
                          setIsCoOrganizerDialogOpen(true);
                        },
                        title: t("communities:make_co_organizer:title"),
                      },
                    ]
                  : undefined
            : undefined
        }
      />
      <EventAttendeesDialog
        eventId={eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <MakeCoOrganizerDialog
        username={coOrganizerAddUser?.name ?? ""}
        eventName={event.data?.title ?? ""}
        open={isCoOrganizerDialogOpen}
        onClose={() => setIsCoOrganizerDialogOpen(false)}
        onSubmit={() => {
          // @TODO(FB): Actually make co-organizer
          setIsCoOrganizerDialogOpen(false);
        }}
      />
    </>
  );
}
