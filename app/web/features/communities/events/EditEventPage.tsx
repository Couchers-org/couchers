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
import { service } from "service";
import type { UpdateEventInput } from "service/events";
import { theme } from "theme";
import dayjs from "utils/dayjs";
import { sendNativeBack, useIsNativeEmbed } from "utils/nativeLink";

import { Event } from "../../../proto/events_pb";
import { eventsRoute, routeToEvent } from "../../../routes";
import { communityEventsBaseKey, eventKey } from "../../queryKeys";
import EventForm, { CreateEventVariables } from "./EventForm";
import { useEvent } from "./hooks";

const StyledBackButton = styled(HeaderButton)(() => ({
  width: "2.5rem",
  height: "2.5rem",
  marginTop: theme.spacing(2),
}));

export default function EditEventPage({ eventId }: { eventId: number }) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES, PROFILE]);
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();

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

  const {
    data: event,
    error: eventError,
    isLoading: isEventLoading,
    isValidEventId,
  } = useEvent({ eventId });

  const queryClient = useQueryClient();
  const {
    mutate: updateEvent,
    error,
    isPending,
  } = useMutation<
    Event.AsObject,
    RpcError,
    CreateEventVariables,
    { parentCommunityId?: number }
  >({
    mutationFn: (data) => {
      const startDateTimeISO8601 = `${data.startDateISO8601}T${data.startTimeISO8601}`;
      const endDateTimeISO8601 = `${data.endDateISO8601}T${data.endTimeISO8601}`;

      const updateEventInput: UpdateEventInput = {
        eventId,
        title: data.dirtyFields.title ? data.title : undefined,
        content: data.dirtyFields.content ? data.content : undefined,
        photoKey: data.dirtyFields.eventImage ? data.eventImage : undefined,
        startTime:
          data.dirtyFields.startTimeISO8601 || data.dirtyFields.startDateISO8601
            ? dayjs(startDateTimeISO8601).toDate()
            : undefined,
        endTime:
          data.dirtyFields.endTimeISO8601 || data.dirtyFields.endDateISO8601
            ? dayjs(endDateTimeISO8601).toDate()
            : undefined,
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
    onSuccess(updatedEvent, _, context) {
      queryClient.setQueryData<Event.AsObject>(eventKey(eventId), updatedEvent);
      queryClient.invalidateQueries({
        queryKey: eventKey(eventId),
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: [
          context?.parentCommunityId
            ? [communityEventsBaseKey, context.parentCommunityId]
            : communityEventsBaseKey,
        ],
      });
      router.push(routeToEvent(updatedEvent.eventId, updatedEvent.slug));
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
        <StyledBackButton
          onClick={handleBackClick}
          aria-label={t("communities:previous_page")}
        >
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
            <Button
              loading={isMutationLoading}
              type="submit"
              sx={{ justifySelf: "start" }}
            >
              {t("global:update")}
            </Button>
          )}
        </EventForm>
      </>
    )
  ) : (
    <NotFoundPage />
  );
}
