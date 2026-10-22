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
import { useState } from "react";
import { dashboardRoute, eventsRoute, routeToEvent } from "routes";
import { service } from "service";
import type { CreateEventInput } from "service/events";
import { theme } from "theme";
import { sendNativeBack, useIsNativeEmbed } from "utils/nativeLink";
import stringOrFirstString from "utils/stringOrFirstString";

import { communityEventsBaseKey } from "../../queryKeys";
import EventForm, { CreateEventVariables } from "./EventForm";
import { useEvent } from "./hooks";
import InviteCommunityDialog from "./InviteCommunityDialog";

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
    typeof window !== "undefined" ? stringOrFirstString(router.query.communityId) : undefined;
  const urlCommunityId =
    urlCommunityIdString && !isNaN(Number.parseInt(urlCommunityIdString))
      ? Number.parseInt(urlCommunityIdString)
      : undefined;

  const duplicateEventIdString =
    typeof window !== "undefined" ? stringOrFirstString(router.query.duplicateEventId) : undefined;
  const duplicateEventId =
    duplicateEventIdString && !isNaN(Number.parseInt(duplicateEventIdString))
      ? Number.parseInt(duplicateEventIdString)
      : undefined;

  const {
    data: eventToDuplicate,
    isLoading: isDuplicateEventLoading,
    error: duplicateEventError,
  } = useEvent({ eventId: duplicateEventId!, enabled: !!duplicateEventId });
  const [inviteCommunityDialogIsOpen, setInviteCommunityDialogIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    mutate: createEvent,
    data: createdEvent,
    error,
    isPending,
  } = useMutation<Event.AsObject, RpcError, CreateEventVariables, { parentCommunityId?: number }>({
    mutationFn: async (data) => {
      // Use uploaded photo, or reuse photo from event being duplicated
      const photoKey = data.eventImage || eventToDuplicate?.photoKey || undefined;

      const createEventInput: CreateEventInput = {
        title: data.title,
        content: data.content,
        photoKey,
        startTime: data.startDate.toPlainDateTime(data.startTime),
        endTime: data.endDate.toPlainDateTime(data.endTime),
        inviteCommunity: data.inviteCommunity,
        address: data.location.name,
        lat: data.location.location.lat,
        lng: data.location.location.lng,
        parentCommunityId: urlCommunityId,
      };
      return service.events.createEvent(createEventInput);
    },

    onMutate({ parentCommunityId }) {
      return {
        parentCommunityId: parentCommunityId ?? urlCommunityId,
      };
    },
    onSuccess(event, variables, context) {
      queryClient.invalidateQueries({
        queryKey: [
          context?.parentCommunityId ? [communityEventsBaseKey, context.parentCommunityId] : communityEventsBaseKey,
        ],
      });
      //create the event and then, if the checkbox was checked, proceed to the inviteCommunity dialog
      if (variables.inviteCommunity) {
        setInviteCommunityDialogIsOpen(true);
      } else {
        router.push(routeToEvent(event.eventId, event.slug));
      }
    },
    onSettled() {
      window.scroll({ top: 0, behavior: "smooth" });
    },
  });

  const { data: accountInfo, isLoading: isAccountInfoLoading } = useAccountInfo();

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
        event={
          eventToDuplicate
            ? {
                ...eventToDuplicate,
                communityInviteRequested: false, //allow new invites for duplicated events
              }
            : undefined
        }
      >
        {({ isMutationLoading }) => (
          <>
            <Button loading={isMutationLoading} type="submit" sx={{ justifySelf: "start" }}>
              {t("global:create")}
            </Button>
            <Typography variant="body1" sx={{ color: theme.palette.grey[600] }}>
              {t("communities:create_event_disclaimer")}
            </Typography>
          </>
        )}
      </EventForm>
      {createdEvent && (
        <InviteCommunityDialog
          eventId={createdEvent.eventId}
          open={inviteCommunityDialogIsOpen}
          afterSuccess={() => {
            setInviteCommunityDialogIsOpen(false);
            router.push({
              pathname: routeToEvent(createdEvent.eventId, createdEvent.slug),
              query: { inviteSuccess: "true" },
            });
          }}
          onClose={() => {
            setInviteCommunityDialogIsOpen(false);
            router.push(routeToEvent(createdEvent.eventId, createdEvent.slug));
          }}
        />
      )}
    </>
  );
}
