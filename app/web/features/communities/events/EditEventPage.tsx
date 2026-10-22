import { styled } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import NotFoundPage from "features/NotFoundPage";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useState } from "react";
import { service } from "service";
import type { UpdateEventInput } from "service/events";
import { theme } from "theme";
import { sendNativeBack, useIsNativeEmbed } from "utils/nativeLink";

import { Event } from "../../../proto/events_pb";
import { eventsRoute, routeToEvent } from "../../../routes";
import { communityEventsBaseKey, eventKey } from "../../queryKeys";
import EventForm, { CreateEventVariables } from "./EventForm";
import { useEvent } from "./hooks";
import InviteCommunityDialog from "./InviteCommunityDialog";

const StyledBackButton = styled(HeaderButton)(() => ({
  width: "2.5rem",
  height: "2.5rem",
  marginTop: theme.spacing(2),
}));

export default function EditEventPage({ eventId }: { eventId: number }) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES, PROFILE]);
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();
  const handleEditCommunityInvite = (updatedEvent: Event.AsObject | undefined, requestCommunityInvite: boolean) => {
    setInviteCommunityDialogIsOpen(false);
    if (!updatedEvent) return;
    const eventUrl = routeToEvent(updatedEvent.eventId, updatedEvent.slug);

    if (requestCommunityInvite) {
      router.push({
        pathname: eventUrl,
        query: {
          inviteSuccess: "true",
        },
      });
    } else {
      router.push(eventUrl);
    }
  };
  const handleBackClick = () => {
    if (isNativeEmbed) {
      sendNativeBack();
      return;
    }
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(eventsRoute);
    }
  };
  const [inviteCommunityDialogIsOpen, setInviteCommunityDialogIsOpen] = useState(false);
  const { data: event, error: eventError, isLoading: isEventLoading, isValidEventId } = useEvent({ eventId });

  const queryClient = useQueryClient();
  const {
    mutate: updateEvent,
    error,
    isPending,
  } = useMutation<Event.AsObject, RpcError, CreateEventVariables, { parentCommunityId?: number }>({
    mutationFn: (data) => {
      const updateEventInput: UpdateEventInput = {
        eventId,
        title: data.dirtyFields.title ? data.title : undefined,
        content: data.dirtyFields.content ? data.content : undefined,
        photoKey: data.dirtyFields.eventImage ? data.eventImage : undefined,
        startTime:
          data.dirtyFields.startDate || data.dirtyFields.startTime
            ? data.startDate.toPlainDateTime(data.startTime)
            : undefined,
        endTime:
          data.dirtyFields.endDate || data.dirtyFields.endTime ? data.endDate.toPlainDateTime(data.endTime) : undefined,
        shouldNotify: data.dirtyFields.shouldNotify,
        address: data.dirtyFields.location ? data.location.name : undefined,
        lat: data.dirtyFields.location ? data.location.location.lat : undefined,
        lng: data.dirtyFields.location ? data.location.location.lng : undefined,
      };

      return service.events.updateEvent(updateEventInput);
    },

    onMutate({ parentCommunityId }) {
      return { parentCommunityId };
    },

    onSuccess(updatedEvent, variables, context) {
      queryClient.setQueryData<Event.AsObject>(eventKey(eventId), updatedEvent);
      queryClient.invalidateQueries({
        queryKey: eventKey(eventId),
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: [
          context?.parentCommunityId ? [communityEventsBaseKey, context.parentCommunityId] : communityEventsBaseKey,
        ],
      });
      if (variables.inviteCommunity) {
        setInviteCommunityDialogIsOpen(true);
      } else {
        router.push(routeToEvent(updatedEvent.eventId, updatedEvent.slug));
      }
    },
    onSettled() {
      window.scroll({ top: 0, behavior: "smooth" });
    },
  });
  return isValidEventId ? (
    eventError ? (
      <Alert severity="error">{eventError.message}</Alert>
    ) : isEventLoading ? (
      <CenteredSpinner />
    ) : (
      <>
        <HtmlMeta title={t("communities:edit_event")} />
        <StyledBackButton onClick={handleBackClick} aria-label={t("communities:previous_page")}>
          <BackIcon />
        </StyledBackButton>
        <EventForm
          error={error}
          event={event}
          isMutationLoading={isPending}
          mutate={updateEvent}
          title={t("communities:edit_event")}
          isEdit
        >
          {({ isMutationLoading }) => (
            <Button loading={isMutationLoading} type="submit" sx={{ justifySelf: "start" }}>
              {t("global:update")}
            </Button>
          )}
        </EventForm>
        <InviteCommunityDialog
          afterSuccess={() => handleEditCommunityInvite(event, true)}
          open={inviteCommunityDialogIsOpen}
          onClose={() => handleEditCommunityInvite(event, false)}
          eventId={eventId}
        />
      </>
    )
  ) : (
    <NotFoundPage />
  );
}
