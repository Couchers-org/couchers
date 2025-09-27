import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { Events } from "@couchers/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RpcError } from "grpc-web";
import { useRouter } from "next/router";

import Alert from "@/components/Alert";
import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "@/components/HtmlMeta";
import NotFoundPage from "@/features/NotFoundPage";
import { COMMUNITY_EVENTS_BASE_KEY, eventKey } from "@/features/queryKeys";
import { useTranslation } from "@/i18n";
import { COMMUNITIES, GLOBAL } from "@/i18n/namespaces";
import { routeToEvent } from "@/routes";
import serviceClients from "@/serviceClients";
import dayjs, { TIME_FORMAT } from "@/utils/dayjs";

import EventForm, { CreateEventVariables } from "./EventForm";
import { useEvent } from "./hooks";

const EditEventPage = ({ eventId }: { eventId: bigint }) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
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
    isPending,
  } = useMutation<
    Events.Event,
    RpcError,
    CreateEventVariables,
    { parentCommunityId?: bigint }
  >({
    mutationFn: (data) => {
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

      const updateEventInput: Parameters<
        typeof serviceClients.events.updateEvent
      >["0"] = {
        eventId,
        title: data.title,
        content: data.content,
        photoKey: data.dirtyFields.eventImage ? data.eventImage : undefined,
        startTime: timestampFromDate(finalStartDate),
        endTime: timestampFromDate(finalEndDate),
        shouldNotify: data.dirtyFields.shouldNotify,
      };

      if (data.isOnline) {
        updateEventInput.mode = {
          case: "onlineInformation",
          value: {
            link: data.dirtyFields.link ? data.link : undefined,
          },
        };
      } else if (data.dirtyFields.location) {
        updateEventInput.mode = {
          case: "offlineInformation",
          value: {
            address: data.location.name,
            lat: data.location.location.lat,
            lng: data.location.location.lng,
          },
        };
      }
      return serviceClients.events.updateEvent(updateEventInput);
    },

    onMutate: ({ parentCommunityId }) => {
      return { parentCommunityId };
    },
    onSuccess: async (updatedEvent, _, context) => {
      queryClient.setQueryData(eventKey(eventId), updatedEvent);
      await queryClient.invalidateQueries({
        queryKey: eventKey(eventId),
        refetchType: "none",
      });
      await queryClient.invalidateQueries({
        queryKey: [
          context?.parentCommunityId
            ? [COMMUNITY_EVENTS_BASE_KEY, context.parentCommunityId]
            : COMMUNITY_EVENTS_BASE_KEY,
        ],
      });
      await router.push(routeToEvent(updatedEvent.eventId, updatedEvent.slug));
    },
    onSettled: () => {
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
};

export default EditEventPage;
