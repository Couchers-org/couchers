import { Typography } from "@material-ui/core";
import Button from "components/Button";
import HtmlMeta from "components/HtmlMeta";
import { CREATE } from "features/constants";
import { communityEventsBaseKey } from "features/queryKeys";
import { Error as GrpcError } from "grpc-web";
import { useRouter } from "next/router";
import { Event } from "proto/events_pb";
import { useMutation, useQueryClient } from "react-query";
import { routeToEvent } from "routes";
import { service } from "service";
import type { CreateEventInput } from "service/events";
import dayjs, { TIME_FORMAT } from "utils/dayjs";
import makeStyles from "utils/makeStyles";
import stringOrFirstString from "utils/stringOrFirstString";

import { CREATE_EVENT, CREATE_EVENT_DISCLAIMER } from "./constants";
import EventForm, {
  CreateEventVariables,
  useEventFormStyles,
} from "./EventForm";

const useStyles = makeStyles((theme) => ({
  disclaimer: {
    color: theme.palette.grey[600],
  },
}));

export default function CreateEventPage() {
  const classes = { ...useEventFormStyles(), ...useStyles() };
  const router = useRouter();

  const urlCommunityIdString =
    typeof window !== "undefined"
      ? stringOrFirstString(router.query.communityId)
      : undefined;
  const urlCommunityId =
    urlCommunityIdString && !isNaN(Number.parseInt(urlCommunityIdString))
      ? Number.parseInt(urlCommunityIdString)
      : undefined;

  const queryClient = useQueryClient();
  const {
    mutate: createEvent,
    error,
    isLoading,
  } = useMutation<
    Event.AsObject,
    GrpcError,
    CreateEventVariables,
    { parentCommunityId?: number }
  >(
    (data) => {
      let createEventInput: CreateEventInput;
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
          address: data.location.name,
          lat: data.location.location.lat,
          lng: data.location.location.lng,
          parentCommunityId: urlCommunityId,
        };
      }
      return service.events.createEvent(createEventInput);
    },
    {
      onMutate({ parentCommunityId }) {
        return {
          parentCommunityId: parentCommunityId ?? urlCommunityId,
        };
      },
      onSuccess(event, __, context) {
        queryClient.invalidateQueries(
          context?.parentCommunityId
            ? [communityEventsBaseKey, context.parentCommunityId]
            : communityEventsBaseKey
        );
        router.push(routeToEvent(event.eventId, event.slug));
      },
      onSettled() {
        window.scroll({ top: 0, behavior: "smooth" });
      },
    }
  );

  return (
    <>
      <HtmlMeta title={CREATE_EVENT} />
      <EventForm
        error={error}
        isMutationLoading={isLoading}
        mutate={createEvent}
        title={CREATE_EVENT}
      >
        {({ isMutationLoading }) => (
          <>
            <Button
              className={classes.submitButton}
              loading={isMutationLoading}
              type="submit"
            >
              {CREATE}
            </Button>
            <Typography className={classes.disclaimer} variant="body1">
              {CREATE_EVENT_DISCLAIMER}
            </Typography>
          </>
        )}
      </EventForm>
    </>
  );
}
