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
      let updateEventInput: UpdateEventInput;
      const startTime = dayjs(data.startTime);
      const endTime = dayjs(data.endTime);
      const finalStartDate = data.startDate
        .startOf("day")
        .add(startTime.get("hour"), "hour")
        .add(startTime.get("minute"), "minute")
        .toDate();
      const finalEndDate = data.endDate
        .startOf("day")
        .add(endTime.get("hour"), "hour")
        .add(endTime.get("minute"), "minute")
        .toDate();

      updateEventInput = {
        eventId,
        isOnline: data.isOnline,
        title: data.dirtyFields.title ? data.title : undefined,
        content: data.dirtyFields.content ? data.content : undefined,
        photoKey: data.dirtyFields.eventImage ? data.eventImage : undefined,
        startTime:
          data.dirtyFields.startTime || data.dirtyFields.startDate
            ? finalStartDate
            : undefined,
        endTime:
          data.dirtyFields.endTime || data.dirtyFields.endDate
            ? finalEndDate
            : undefined,
        shouldNotify: data.dirtyFields.shouldNotify,
      };

      if (data.isOnline) {
        updateEventInput = Object.assign(updateEventInput, {
          link: data.dirtyFields.link ? data.link : undefined,
        });
      } else if (data.dirtyFields.location) {
        updateEventInput = Object.assign(updateEventInput, {
          address: data.location.name,
          lat: data.location.location.lat,
          lng: data.location.location.lng,
        });
      }
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
          defaultOnline={false}
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
