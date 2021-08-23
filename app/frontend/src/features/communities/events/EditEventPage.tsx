import Button from "components/Button";
import { UPDATE } from "features/constants";
import NotFoundPage from "features/NotFoundPage";
import type { Error as GrpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import { communityEventsBaseKey, eventKey } from "queryKeys";
import { useMutation, useQueryClient } from "react-query";
import { useHistory } from "react-router-dom";
import { routeToEvent } from "routes";
import { service } from "service";
import type { UpdateEventInput } from "service/events";
import dayjs, { TIME_FORMAT } from "utils/dayjs";

import EventForm, { CreateEventData, useEventFormStyles } from "./EventForm";
import { useEvent } from "./hooks";

export default function EditEventPage() {
  const classes = useEventFormStyles();
  const history = useHistory();

  const { data: event, eventId, isValidEventId } = useEvent();

  const queryClient = useQueryClient();
  const {
    mutate: updateEvent,
    error,
    isLoading,
  } = useMutation<
    Event.AsObject,
    GrpcError,
    CreateEventData,
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

      if (data.isOnline) {
        updateEventInput = {
          eventId,
          isOnline: data.isOnline,
          title: data.title,
          content: data.content,
          photoKey: data.eventImage,
          startTime: finalStartDate,
          endTime: finalEndDate,
          link: data.link,
        };
      } else {
        updateEventInput = {
          eventId,
          isOnline: data.isOnline,
          title: data.title,
          content: data.content,
          photoKey: data.eventImage,
          startTime: finalStartDate,
          endTime: finalEndDate,
          address: data.location.name,
          lat: data.location.location.lat,
          lng: data.location.location.lng,
        };
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
        history.push(routeToEvent(updatedEvent.eventId, updatedEvent.slug));
      },
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    }
  );

  return isValidEventId ? (
    <EventForm
      error={error}
      event={event}
      isMutationLoading={isLoading}
      mutate={updateEvent}
      title="Edit event"
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
  ) : (
    <NotFoundPage />
  );
}
