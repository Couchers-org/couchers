import { Error as GrpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import { communityEventsBaseKey } from "queryKeys";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import type { CreateEventInput } from "service/events";
import makeStyles from "utils/makeStyles";

import { CREATE_EVENT, CREATE_EVENT_SUCCESS } from "./constants";
import EventForm, { CreateEventData } from "./EventForm";

const useStyles = makeStyles((theme) => ({}));

export default function CreateEventPage() {
  const queryClient = useQueryClient();
  const {
    mutate: createEvent,
    error,
    isLoading,
    isSuccess,
  } = useMutation<
    Event.AsObject,
    GrpcError,
    CreateEventData,
    { parentCommunityId?: number }
  >(
    (data) => {
      let createEventInput: CreateEventInput;
      const finalStartDate = data.startDate
        .startOf("day")
        .add(data.startTime.get("hour"), "hour")
        .add(data.startTime.get("minute"), "minute")
        .toDate();
      const finalEndDate = data.endDate
        .startOf("day")
        .add(data.endTime.get("hour"), "hour")
        .add(data.endTime.get("minute"), "minute")
        .toDate();
      if (data.isOnline) {
        createEventInput = {
          isOnline: data.isOnline,
          title: data.title,
          content: data.content,
          photoKey: data.eventImage,
          startTime: finalStartDate,
          endTime: finalEndDate,
          // TODO: not hardcode this and allow user to specify community ID?
          parentCommunityId: 1,
          link: data.link,
        };
      } else {
        createEventInput = {
          isOnline: data.isOnline,
          title: data.title,
          content: data.content,
          photoKey: data.eventImage,
          startTime: finalStartDate,
          endTime: finalEndDate,
          address: data.location.simplifiedName,
          lat: data.location.location.lat,
          lng: data.location.location.lng,
        };
      }
      return service.events.createEvent(createEventInput);
    },
    {
      onMutate({ parentCommunityId }) {
        return { parentCommunityId };
      },
      onSuccess(_, __, context) {
        queryClient.invalidateQueries(
          context?.parentCommunityId
            ? [communityEventsBaseKey, context.parentCommunityId]
            : communityEventsBaseKey
        );
      },
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    }
  );

  return (
    <EventForm
      error={error}
      isMutationLoading={isLoading}
      isMutationSuccess={isSuccess}
      mutate={createEvent}
      successMessage={CREATE_EVENT_SUCCESS}
      title={CREATE_EVENT}
    />
  );
}
