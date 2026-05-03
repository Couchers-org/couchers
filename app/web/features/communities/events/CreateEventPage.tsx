import { styled, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import useAccountInfo from "features/auth/useAccountInfo";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Event } from "proto/events_pb";
import { dashboardRoute, eventsRoute, routeToEvent } from "routes";
import { service } from "service";
import type { CreateEventInput } from "service/events";
import { theme } from "theme";
import dayjs from "utils/dayjs";
import stringOrFirstString from "utils/stringOrFirstString";

import { sendWebBack, useIsNativeEmbed } from "../../../utils/nativeLink";
import { communityEventsBaseKey } from "../../queryKeys";
import EventForm, { CreateEventVariables } from "./EventForm";
import { useEvent } from "./hooks";

const StyledBackButton = styled(HeaderButton)(() => ({
  gridArea: "backButton",
  width: "2.5rem",
  height: "2.5rem",
  marginTop: theme.spacing(2),
}));

export default function CreateEventPage() {
  const { t } = useTranslation([GLOBAL, COMMUNITIES, PROFILE]);
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();

  const urlCommunityIdString =
    typeof window !== "undefined"
      ? stringOrFirstString(router.query.communityId)
      : undefined;
  const urlCommunityId =
    urlCommunityIdString && !isNaN(Number.parseInt(urlCommunityIdString))
      ? Number.parseInt(urlCommunityIdString)
      : undefined;

  const duplicateEventIdString =
    typeof window !== "undefined"
      ? stringOrFirstString(router.query.duplicateEventId)
      : undefined;
  const duplicateEventId =
    duplicateEventIdString && !isNaN(Number.parseInt(duplicateEventIdString))
      ? Number.parseInt(duplicateEventIdString)
      : undefined;

  const {
    data: eventToDuplicate,
    isLoading: isDuplicateEventLoading,
    error: duplicateEventError,
  } = useEvent({ eventId: duplicateEventId!, enabled: !!duplicateEventId });

  const queryClient = useQueryClient();
  const {
    mutate: createEvent,
    error,
    isPending,
  } = useMutation<
    Event.AsObject,
    RpcError,
    CreateEventVariables,
    { parentCommunityId?: number }
  >({
    mutationFn: (data) => {
      let createEventInput: CreateEventInput;
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

      // Use uploaded photo, or reuse photo from event being duplicated
      const photoKey =
        data.eventImage || eventToDuplicate?.photoKey || undefined;

      if (data.isOnline) {
        createEventInput = {
          isOnline: data.isOnline,
          title: data.title,
          content: data.content,
          photoKey,
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
          photoKey,
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

    onMutate({ parentCommunityId }) {
      return {
        parentCommunityId: parentCommunityId ?? urlCommunityId,
      };
    },
    onSuccess(event, __, context) {
      queryClient.invalidateQueries({
        queryKey: [
          context?.parentCommunityId
            ? [communityEventsBaseKey, context.parentCommunityId]
            : communityEventsBaseKey,
        ],
      });
      router.push(routeToEvent(event.eventId, event.slug));
    },
    onSettled() {
      window.scroll({ top: 0, behavior: "smooth" });
    },
  });

  const { data: accountInfo, isLoading: isAccountInfoLoading } =
    useAccountInfo();

  const handleBackClick = () => {
    if (isNativeEmbed) {
      sendWebBack();
      return;
    }
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(eventsRoute);
    }
  };

  if (isDuplicateEventLoading) {
    return <CenteredSpinner />;
  }

  return (
    <>
      <HtmlMeta title={t("communities:create_event_page_title")} />
      <ProfileIncompleteDialog
        open={!isAccountInfoLoading && !accountInfo?.profileComplete}
        onClose={() => router.push(dashboardRoute)}
        attempted_action="create_event"
      />
      <StyledBackButton onClick={handleBackClick}>
        <BackIcon />
      </StyledBackButton>
      <EventForm
        error={error || duplicateEventError}
        isMutationLoading={isPending}
        mutate={createEvent}
        title={t("communities:create_event_page_title")}
        isEdit={false}
        event={eventToDuplicate}
      >
        {({ isMutationLoading }) => (
          <>
            <Button
              loading={isMutationLoading}
              type="submit"
              sx={{ justifySelf: "start" }}
            >
              {t("global:create")}
            </Button>
            <Typography variant="body1" sx={{ color: theme.palette.grey[600] }}>
              {t("communities:create_event_disclaimer")}
            </Typography>
          </>
        )}
      </EventForm>
    </>
  );
}
