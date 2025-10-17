import { LiteUser } from "@couchers/services/api";
import { Event } from "@couchers/services/events";
import { Remove } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useState } from "react";

import Snackbar from "@/components/Snackbar";
import RemoveAsCoOrganizerDialog from "@/features/communities/events/RemoveAsCoOrganizerDialog";
import { eventOrganizersKey } from "@/features/queryKeys";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { service } from "@/service";

import EventOrganizersDialog from "./EventOrganizersDialog";
import EventUsers from "./EventUsers";
import { useEventOrganizers } from "./hooks";

interface EventOrganizersProps {
  event: Event.AsObject;
}

const EventOrganizers = ({ event }: EventOrganizersProps) => {
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

  const [organizerToRemove, setOrganizerToRemove] = useState<
    undefined | LiteUser.AsObject
  >();

  const [isCoOrganizerDialogOpen, setIsCoOrganizerDialogOpen] = useState(false);

  // Organizers can remove themselves, creator can remove organizers
  const canBeRemovedByCurrentUser = (user: LiteUser.AsObject) =>
    (isCreatedByCurrentUser && currentUser.data?.userId !== user.userId) ||
    (!isCreatedByCurrentUser && currentUser.data?.userId === user.userId);

  const { mutate: removeAsEventOrganizer, error: mutationError } = useMutation<
    Empty.AsObject,
    RpcError,
    number
  >({
    mutationFn: (userId) =>
      service.events.removeEventOrganizer(event.eventId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: eventOrganizersKey({ eventId: event.eventId, type: "all" }),
      });
    },
  });

  return (
    <>
      <EventUsers
        emptyState={t("communities:no_organizers")}
        error={organizerIdsError}
        hasNextPage={hasNextPage}
        onSeeAllClick={() => {
          setIsDialogOpen(true);
        }}
        userIds={organizerIds}
        title={t("communities:organizers")}
        getUserMenuItems={(user) =>
          canBeRemovedByCurrentUser(user)
            ? [
                {
                  icon: Remove,
                  onClick: () => {
                    setOrganizerToRemove(user);
                    setIsCoOrganizerDialogOpen(true);
                  },
                  label: t("communities:remove_as_co_organizer:title"),
                },
              ]
            : undefined
        }
      />
      <EventOrganizersDialog
        eventId={event.eventId}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
      />

      <RemoveAsCoOrganizerDialog
        username={organizerToRemove?.name ?? ""}
        eventName={event.title}
        open={isCoOrganizerDialogOpen}
        onClose={() => {
          setIsCoOrganizerDialogOpen(false);
        }}
        onSubmit={() => {
          if (organizerToRemove) {
            removeAsEventOrganizer(organizerToRemove.userId);
          }
          setIsCoOrganizerDialogOpen(false);
        }}
      />
      {mutationError && (
        <Snackbar severity="error">{mutationError.message}</Snackbar>
      )}
    </>
  );
};

export default EventOrganizers;
