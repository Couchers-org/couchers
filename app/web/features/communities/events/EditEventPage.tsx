import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { UPDATE } from "features/constants";
import NotFoundPage from "features/NotFoundPage";
import { communityEventsBaseKey, eventKey } from "features/queryKeys";
import type { Error as GrpcError } from "grpc-web";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { Event } from "proto/events_pb";
import { useMutation, useQueryClient } from "react-query";
import { routeToEvent } from "routes";
import { service } from "service";
import type { UpdateEventInput } from "service/events";
import dayjs, { TIME_FORMAT } from "utils/dayjs";

import EventForm, {
  CreateEventVariables,
  useEventFormStyles,
} from "./EventForm";
import { useEvent } from "./hooks";

export default function EditEventPage({ eventId }: { eventId: number }) {
  const { t } = useTranslation(["communities"]);
  const classes = useEventFormStyles();
  const router = useRouter();

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
    isLoading,
  } = useMutation<
    Event.AsObject,
    GrpcError,
    CreateEventVariables,
    { parentCommunityId?: number }
  >(
    (data) => {
      let updateEventInput: UpdateEventInput;
      const startTime = dayjs(data.startTime, TIME_FORMAT);
      const endTime = dayjs(data.endTime, TIME_FORMAT);
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
    {
      onMutate({ parentCommunityId }) {
        return { parentCommunityId };
      },
      onSuccess(updatedEvent, _, context) {
        queryClient.setQueryData<Event.AsObject>(
          eventKey(eventId),
          updatedEvent
        );
        queryClient.invalidateQueries(eventKey(eventId), {
          refetchActive: false,
        });
        queryClient.invalidateQueries(
          context?.parentCommunityId
            ? [communityEventsBaseKey, context.parentCommunityId]
            : communityEventsBaseKey
        );
        router.push(routeToEvent(updatedEvent.eventId, updatedEvent.slug));
      },
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    }
  );

  return isValidEventId ? (
    eventError ? (
      <Alert severity="error">{eventError.message}</Alert>
    ) : isEventLoading ? (
      <CircularProgress />
    ) : (
      <>
        <HtmlMeta title={t("communities:edit_event")} />
        <EventForm
          error={error}
          event={event}
          isMutationLoading={isLoading}
          mutate={updateEvent}
          title={t("communities:edit_event")}
        >
          {({ isMutationLoading }) => (
            <Button
              className={classes.submitButton}
              loading={isMutationLoading}
              type="submit"
            >
              {UPDATE}
            </Button>
          )}
        </EventForm>
      </>
    )
  ) : (
    <NotFoundPage />
  );
}
