import { LiteUser } from "@couchers/services/api";
import { Event } from "@couchers/services/events";
import { Add } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useMemo, useState } from "react";

import { EllipsisMenuItem } from "@/components/EllipsisMenu";
import Snackbar from "@/components/Snackbar";
import MakeCoOrganizerDialog from "@/features/communities/events/MakeCoOrganizerDialog";
import { eventOrganizersKey } from "@/features/queryKeys";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { useTranslation } from "@/i18n";
import { COMMUNITIES } from "@/i18n/namespaces";
import { service } from "@/service";

import EventAttendeesDialog from "./EventAttendeesDialog";
import EventUsers from "./EventUsers";
import { useEventAttendees, useEventOrganizers } from "./hooks";

interface EventAttendeesProps {
  event: Event.AsObject;
}

const EventAttendees = ({ event }: EventAttendeesProps) => {
  const { attendeesIds, error, hasNextPage } = useEventAttendees({
    eventId: event.eventId,
    type: "summary",
  });

  const { organizerIds } = useEventOrganizers({
    eventId: event.eventId,
    type: "all",
  });

  // Optimize searching for organizer ids
  const organizerIdSet = useMemo(() => {
    const set = new Set<number>();

    if (organizerIds) {
      organizerIds.forEach((id) => {
        set.add(id);
      });
    }

    return set;
  }, [organizerIds]);

  const currentUser = useCurrentUser();

  const isCoOrganizedByCurrentUser = useMemo(
    () => currentUser.data && organizerIdSet.has(currentUser.data.userId),
    [currentUser.data, organizerIdSet],
  );

  const { t } = useTranslation([COMMUNITIES]);
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [userToPromote, setUserToPromote] = useState<
    undefined | LiteUser.AsObject
  >();

  const [isCoOrganizerDialogOpen, setIsCoOrganizerDialogOpen] = useState(false);

  const { mutate: makeEventOrganizer, error: mutationError } = useMutation<
    Empty.AsObject,
    RpcError,
    number
  >({
    mutationFn: (userId) =>
      service.events.inviteEventOrganizer(event.eventId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: eventOrganizersKey({ eventId: event.eventId, type: "all" }),
      });
    },
  });

  const getUserMenuItems = (
    user: LiteUser.AsObject,
  ): EllipsisMenuItem[] | undefined => {
    if (
      user.userId === currentUser.data?.userId ||
      organizerIdSet.has(user.userId)
    ) {
      return undefined;
    }

    return [
      {
        icon: Add,
        onClick: () => {
          setUserToPromote(user);
          setIsCoOrganizerDialogOpen(true);
        },
        label: t("communities:make_co_organizer:title"),
      },
    ];
  };

  return (
    <>
      <EventUsers
        emptyState={t("communities:no_attendees")}
        error={error}
        hasNextPage={hasNextPage}
        onSeeAllClick={() => {
          setIsDialogOpen(true);
        }}
        userIds={attendeesIds}
        title={t("communities:attendees")}
        getUserMenuItems={
          isCoOrganizedByCurrentUser ? getUserMenuItems : undefined
        }
      />
      <EventAttendeesDialog
        eventId={event.eventId}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
        }}
      />
      <MakeCoOrganizerDialog
        username={userToPromote?.name ?? ""}
        eventName={event.title}
        open={isCoOrganizerDialogOpen}
        onClose={() => {
          setIsCoOrganizerDialogOpen(false);
        }}
        onSubmit={() => {
          if (userToPromote) {
            makeEventOrganizer(userToPromote.userId);
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

export default EventAttendees;
