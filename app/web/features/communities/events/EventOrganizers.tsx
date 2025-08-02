import { Remove } from "@mui/icons-material";
import RemoveAsCoOrganizerDialog from "features/communities/events/RemoveAsCoOrganizerDialog";
import { eventOrganizersKey } from "features/queryKeys";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { Event } from "proto/events_pb";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

import EventOrganizersDialog from "./EventOrganizersDialog";
import EventUsers from "./EventUsers";
import { useEventOrganizers } from "./hooks";

interface EventOrganizersProps {
  event: Event.AsObject;
}

export default function EventOrganizers({ event }: EventOrganizersProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const queryClient = useQueryClient();

  const {
    error: organizerIdsError,
    hasNextPage,
    organizerIds,
  } = useEventOrganizers({ eventId: event.eventId, type: "summary" });

  const currentUser = useCurrentUser();

  const isCreatedByCurrentUser =
    currentUser.data?.userId === event.creatorUserId;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [coOrganizerRemoveUser, setCoOrganizerRemoveUser] = useState<
    undefined | LiteUser.AsObject
  >();

  const [isCoOrganizerDialogOpen, setIsCoOrganizerDialogOpen] = useState(false);

  // Organizers can remove themselves, creator can remove organizers
  const canBeRemovedByCurrentUser = (user: LiteUser.AsObject) =>
    (isCreatedByCurrentUser && currentUser.data?.userId !== user.userId) ||
    (!isCreatedByCurrentUser && currentUser.data?.userId === user.userId);

  // @TODO(FB) Error handling
  const { mutate: removeAsEventOrganizer } = useMutation<
    Empty.AsObject,
    RpcError,
    number
  >((userId) => service.events.removeEventOrganizer(event.eventId, userId), {
    onSuccess: () => {
      queryClient.invalidateQueries([
        eventOrganizersKey({ eventId: event.eventId, type: "summary" }),
      ]);
    },
  });

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
        eventId={event.eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      <RemoveAsCoOrganizerDialog
        username={coOrganizerRemoveUser?.name ?? ""}
        eventName={event.title ?? ""}
        open={isCoOrganizerDialogOpen}
        onClose={() => setIsCoOrganizerDialogOpen(false)}
        onSubmit={() => {
          if (coOrganizerRemoveUser) {
            removeAsEventOrganizer(coOrganizerRemoveUser.userId);
          }
          setIsCoOrganizerDialogOpen(false);
        }}
      />
    </>
  );
}
