import { Add } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EllipsisMenuItem } from "components/EllipsisMenu";
import Snackbar from "components/Snackbar";
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
import { service } from "service";

import EventAttendeesDialog from "./EventAttendeesDialog";
import EventUsers from "./EventUsers";
import { useEventAttendees, useEventOrganizers } from "./hooks";

interface EventAttendeesProps {
  event: Event.AsObject;
}

const PAGE_SIZE = 9;

export default function EventAttendees({ event }: EventAttendeesProps) {
  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useEventAttendees({
      eventId: event.eventId,
      type: "summary",
      pageSize: PAGE_SIZE,
    });

  const [pageNumber, setPageNumber] = useState(1);
  const currentPage = data?.pages && data.pages[pageNumber - 1];

  const pagesLength = data?.pages.length ?? 0;

  const handelPreviousPageClick = () => {
    setPageNumber((current) => Math.max(current - 1, 1));
  };

  const handleNextPageClick = async () => {
    if (pageNumber < pagesLength) {
      setPageNumber((current) => current + 1);
      return;
    }

    if (hasNextPage) {
      await fetchNextPage();
      setPageNumber((current) => current + 1);
    }
  };

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
    onSuccess: () => {
      queryClient.invalidateQueries({
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
        onSeeAllClick={() => setIsDialogOpen(true)}
        userIds={currentPage?.attendeeUserIdsList}
        title={t("communities:attendees")}
        layout="grid"
        isLoading={isLoading}
        pagination={{
          pageNumber: pageNumber,
          currentPage: currentPage,
          handelPreviousPageClick: handelPreviousPageClick,
          handleNextPageClick: handleNextPageClick,
        }}
        getUserMenuItems={
          isCoOrganizedByCurrentUser ? getUserMenuItems : undefined
        }
      />
      <EventAttendeesDialog
        eventId={event.eventId}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <MakeCoOrganizerDialog
        username={userToPromote?.name ?? ""}
        eventName={event.title ?? ""}
        open={isCoOrganizerDialogOpen}
        onClose={() => setIsCoOrganizerDialogOpen(false)}
        onSubmit={() => {
          if (userToPromote) {
            makeEventOrganizer(userToPromote.userId);
          }
          setIsCoOrganizerDialogOpen(false);
        }}
      />
      {mutationError && (
        <Snackbar severity="error">{mutationError?.message}</Snackbar>
      )}
    </>
  );
}
