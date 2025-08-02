import { Add } from "@mui/icons-material";
import MakeCoOrganizerDialog from "features/communities/events/MakeCoOrganizerDialog";
import { eventOrganizersKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { Event } from "proto/events_pb";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

import EventAttendeesDialog from "./EventAttendeesDialog";
import EventUsers from "./EventUsers";
import { useEventAttendees, useEventOrganizers } from "./hooks";

interface EventAttendeesProps {
  event: Event.AsObject;
}

export default function EventAttendees({ event }: EventAttendeesProps) {
  const { attendeesIds, error, hasNextPage } = useEventAttendees({
    eventId: event.eventId,
    type: "summary",
  });

  const { organizerIds } = useEventOrganizers({
    eventId: event.eventId,
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
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [coOrganizerAddUser, setCoOrganizerAddUser] = useState<
    undefined | LiteUser.AsObject
  >();

  const [isCoOrganizerDialogOpen, setIsCoOrganizerDialogOpen] = useState(false);

  // @TODO(FB) Error handling
  const { mutate: makeEventOrganizer } = useMutation<
    Empty.AsObject,
    RpcError,
    number
  >((userId) => service.events.inviteEventOrganizer(event.eventId, userId), {
    onSuccess: () => {
      queryClient.invalidateQueries([
        eventOrganizersKey({ eventId: event.eventId, type: "all" }),
      ]);
    },
  });

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
        eventId={event.eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <MakeCoOrganizerDialog
        username={coOrganizerAddUser?.name ?? ""}
        eventName={event.title ?? ""}
        open={isCoOrganizerDialogOpen}
        onClose={() => setIsCoOrganizerDialogOpen(false)}
        onSubmit={() => {
          if (coOrganizerAddUser) {
            makeEventOrganizer(coOrganizerAddUser.userId);
          }
          setIsCoOrganizerDialogOpen(false);
        }}
      />
    </>
  );
}
