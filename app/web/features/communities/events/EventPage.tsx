import {
  Card,
  Chip,
  darken,
  Link as MuiLink,
  styled,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eventImagePlaceholderUrl } from "appConstants";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon, CalendarIcon } from "components/Icons";
import Markdown from "components/Markdown";
import Snackbar from "components/Snackbar";
import EventAttendees from "features/communities/events/EventAttendees";
import NotFoundPage from "features/NotFoundPage";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { useRouter } from "next/router";
import { AttendanceState, Event } from "proto/events_pb";
import { useEffect, useState } from "react";
import { eventsRoute, routeToEditEvent, routeToEvent } from "routes";
import { service } from "service";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";

import { eventAttendeesBaseKey, eventKey } from "../../queryKeys";
import CommentTree from "../discussions/CommentTree";
import AttendanceMenu from "./AttendanceMenu";
import CancelEventDialog from "./CancelEventDialog";
import EventOrganizers from "./EventOrganizers";
import { useEvent } from "./hooks";
import InviteCommunityDialog from "./InviteCommunityDialog";

const StyledHeader = styled("div")(() => ({
  alignItems: "center",
  gap: theme.spacing(2),
  display: "grid",
  gridTemplateAreas: `
    "backButton eventTitle"
    "eventTime eventTime"
    "actionButtons actionButtons"
  `,
  gridTemplateColumns: "3.125rem 1fr",
  marginBlockEnd: theme.spacing(4),
  marginBlockStart: theme.spacing(2),

  [theme.breakpoints.up("sm")]: {
    gridTemplateAreas: `
      "backButton eventTitle actionButtons"
      ". eventTime eventTime"
    `,
    gridTemplateColumns: "3.125rem 1fr auto",
  },
}));

const StyledBackButton = styled(HeaderButton)(() => ({
  gridArea: "backButton",
  width: "3.125rem",
  height: "3.125rem",
}));

const StyledTitle = styled("div")(() => ({
  gridArea: "eventTitle",
}));

const StyledOnlineInfoContainer = styled("div")(() => ({
  display: "grid",
  columnGap: theme.spacing(2),
  gridAutoFlow: "column",
  gridTemplateColumns: "max-content max-content",
}));

const StyledEventTypeText = styled(Typography)(() => ({
  color: theme.palette.grey[600],
}));

const StyledCoverPhoto = styled("img")((props) => ({
  height: 100,
  [theme.breakpoints.up("md")]: {
    height: 200,
  },
  width: "100%",
  objectFit: props.src === eventImagePlaceholderUrl ? "contain" : "cover",
  marginBlockStart: theme.spacing(2),
}));

const StyledCancelledChip = styled(Chip)(() => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  fontWeight: "bold",
}));

const StyledCancelButton = styled(Button)(() => ({
  flexShrink: 0,
  "&:hover": {
    backgroundColor: darken(theme.palette.error.main, 0.1),
  },
  backgroundColor: theme.palette.error.main,
}));

const StyledActionButtonsContainer = styled("div")(() => ({
  display: "grid",
  gridAutoFlow: "column",
  columnGap: theme.spacing(1),
  gridArea: "actionButtons",
  justifySelf: "start",

  [theme.breakpoints.down("md")]: {
    gridAutoFlow: "row",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, max-content))",
    gap: theme.spacing(1),
    width: "100%",
  },
}));

const ActionButtonSx = {
  whiteSpace: "normal",
  textAlign: "center",
  height: "auto",
  lineHeight: 1.2,
  paddingBlock: theme.spacing(1),
};

const StyledEventTimeContainer = styled("div")(() => ({
  alignItems: "center",
  gridArea: "eventTime",
  display: "grid",
  columnGap: theme.spacing(1),
  gridTemplateColumns: "3.75rem auto",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "3.75rem 30%",
  },
}));

const StyledCalendarIcon = styled(CalendarIcon)(() => ({
  marginInlineStart: theme.spacing(-0.5),
  height: "3.75rem",
  width: "3.75rem",
}));

const StyledEventDetailsContainer = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(3),
  marginBlockEnd: theme.spacing(5),
}));

const StyledCardSection = styled(Card)(() => ({
  padding: theme.spacing(2),
  "& + &": {
    marginBlockStart: theme.spacing(3),
  },
}));

const StyledDiscussionContainer = styled("div")(() => ({
  marginBlockEnd: theme.spacing(5),
}));

function getEventTimeString(
  startTime: Timestamp.AsObject,
  endTime: Timestamp.AsObject,
) {
  const start = dayjs(timestamp2Date(startTime));
  const end = dayjs(timestamp2Date(endTime));

  return `${start.format("LLLL")} to ${end.format(
    end.isSame(start, "day") ? "LT" : "LLLL",
  )}`;
}

export default function EventPage({
  eventId,
  eventSlug,
}: {
  eventId: number;
  eventSlug: string;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: event,
    error: eventError,
    isLoading,
    isValidEventId,
  } = useEvent({ eventId });

  const {
    isPending: isSetEventAttendanceLoading,
    error: setEventAttendanceError,
    mutate: setEventAttendance,
  } = useMutation<Event.AsObject, RpcError, AttendanceState>({
    mutationFn: (newEventAttendance: AttendanceState) => {
      return service.events.setEventAttendance({
        attendanceState: newEventAttendance,
        eventId,
      });
    },
    onSuccess(updatedEvent) {
      queryClient.setQueryData<Event.AsObject>(eventKey(eventId), updatedEvent);
      queryClient.invalidateQueries({
        queryKey: eventKey(eventId),
        refetchType: "none",
      });
      queryClient.invalidateQueries({
        queryKey: [eventAttendeesBaseKey, eventId],
      });
    },
  });

  const [cancelDialogIsOpen, setCancelDialogIsOpen] = useState(false);
  const [showInviteCommunitySuccess, setShowInviteCommunitySuccess] =
    useState(false);
  const [inviteCommunityDialogIsOpen, setInviteCommunityDialogIsOpen] =
    useState(false);

  const isPastEvent = event?.endTime
    ? dayjs().isAfter(timestamp2Date(event.endTime))
    : false;

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(eventsRoute);
    }
  };

  useEffect(() => {
    if (event?.slug && event.slug !== eventSlug) {
      router.replace(routeToEvent(event.eventId, event.slug));
    }
  }, [event, eventSlug, router]);

  if (!isValidEventId) {
    return <NotFoundPage />;
  }

  return (
    <>
      <HtmlMeta title={event?.title} />
      {(eventError || setEventAttendanceError) && (
        <Alert severity="error">
          {eventError?.message || setEventAttendanceError?.message || ""}
        </Alert>
      )}
      {showInviteCommunitySuccess && (
        <Snackbar severity="success">
          {t("communities:invite_community_dialog.toast_success")}
        </Snackbar>
      )}
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        event && (
          <>
            <StyledCoverPhoto
              src={event.photoUrl || eventImagePlaceholderUrl}
              alt=""
              data-testid="event-cover-photo"
            />
            <StyledHeader>
              <StyledBackButton
                onClick={handleBackClick}
                aria-label={t("communities:previous_page")}
              >
                <BackIcon />
              </StyledBackButton>
              <StyledTitle>
                <Typography variant="h1">{event.title}</Typography>
                {event.onlineInformation ? (
                  <StyledOnlineInfoContainer>
                    <StyledEventTypeText variant="body1">
                      {t("communities:virtual_event")}
                    </StyledEventTypeText>
                    <MuiLink
                      href={event.onlineInformation.link}
                      underline="hover"
                    >
                      {t("communities:event_link")}
                    </MuiLink>
                  </StyledOnlineInfoContainer>
                ) : (
                  <StyledEventTypeText variant="body1">
                    {event.offlineInformation?.address}
                  </StyledEventTypeText>
                )}
                {event.isCancelled && (
                  <StyledCancelledChip label={t("communities:cancelled")} />
                )}
              </StyledTitle>
              <StyledActionButtonsContainer>
                {event.canEdit ? (
                  <>
                    <Button
                      component={Link}
                      variant="outlined"
                      disabled={event.isCancelled || isPastEvent}
                      href={routeToEditEvent(event.eventId, event.slug)}
                      sx={{
                        color: theme.palette.common.black,
                        borderColor: theme.palette.grey[300],

                        "&:hover": {
                          borderColor: theme.palette.grey[300],
                          backgroundColor: "#3135390A",
                        },

                        [theme.breakpoints.down("md")]: {
                          ...ActionButtonSx,
                        },
                      }}
                    >
                      {t("communities:edit_event")}
                    </Button>
                    <StyledCancelButton
                      onClick={() => setCancelDialogIsOpen(true)}
                      variant="contained"
                      color="primary"
                      disabled={event.isCancelled || isPastEvent}
                    >
                      {t("communities:cancel_event")}
                    </StyledCancelButton>
                    <CancelEventDialog
                      open={cancelDialogIsOpen}
                      onClose={() => setCancelDialogIsOpen(false)}
                      eventId={eventId}
                    />
                    <Button
                      onClick={() => setInviteCommunityDialogIsOpen(true)}
                      variant="contained"
                      color="secondary"
                      disabled={event.isCancelled || isPastEvent}
                    >
                      {t("communities:invite_community_dialog_buttons.open")}
                    </Button>
                    <InviteCommunityDialog
                      afterSuccess={() => setShowInviteCommunitySuccess(true)}
                      open={inviteCommunityDialogIsOpen}
                      onClose={() => setInviteCommunityDialogIsOpen(false)}
                      eventId={eventId}
                    />
                  </>
                ) : null}

                <AttendanceMenu
                  loading={isSetEventAttendanceLoading}
                  onChangeAttendanceState={(attendanceState) =>
                    setEventAttendance(attendanceState)
                  }
                  attendanceState={event.attendanceState}
                  id="event-page-attendance"
                  disabled={event.isCancelled || isPastEvent}
                />
              </StyledActionButtonsContainer>

              <StyledEventTimeContainer>
                <StyledCalendarIcon />
                <Typography variant="body1">
                  {getEventTimeString(event.startTime!, event.endTime!)}
                </Typography>
              </StyledEventTimeContainer>
            </StyledHeader>
            <StyledEventDetailsContainer>
              <StyledCardSection>
                <Typography variant="h2">
                  {t("communities:details_subheading_colon")}
                </Typography>
                <Markdown source={event.content} topHeaderLevel={3} />
              </StyledCardSection>
              <EventOrganizers event={event} />
              <EventAttendees event={event} />
            </StyledEventDetailsContainer>
            <StyledDiscussionContainer>
              <Typography variant="h2">
                {t("communities:event_discussion")}
              </Typography>
              <CommentTree threadId={event.thread!.threadId} />
            </StyledDiscussionContainer>
          </>
        )
      )}
    </>
  );
}
