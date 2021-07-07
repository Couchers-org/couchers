import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HeaderButton from "components/HeaderButton";
import { BackIcon, CalendarIcon } from "components/Icons";
import Markdown from "components/Markdown";
import { TO } from "features/constants";
import NotFoundPage from "features/NotFoundPage";
import { Error as GrpcError } from "grpc-web";
import { AttendanceState, Event } from "proto/events_pb";
import {
  eventAttendeesBaseKey,
  eventKey,
  isEventUsersInputType,
} from "queryKeys";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { routeToEvent } from "routes";
import { service } from "service";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import { DETAILS, GOING, NOT_GOING, VIRTUAL_EVENT } from "./constants";
import EventAttendees from "./EventAttendees";
import EventOrganisers from "./EventOrganisers";

export const useEventPageStyles = makeStyles((theme) => ({
  header: {
    alignItems: "center",
    gap: theme.spacing(2, 2),
    display: "grid",
    gridTemplateAreas: `
      "backButton eventTitle eventTitle"
      "eventTime eventTime eventTime"
      "attendanceButton attendanceButton ."
    `,
    gridAutoFlow: "column",
    gridTemplateColumns: "3.125rem 1fr auto",
    marginBlockEnd: theme.spacing(4),
    marginBlockStart: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      gridTemplateAreas: `
      "backButton eventTitle attendanceButton"
      ". eventTime eventTime"
    `,
    },
  },
  backButton: {
    gridArea: "backButton",
    width: "3.125rem",
    height: "3.125rem",
  },
  eventTitle: {
    gridArea: "eventTitle",
  },
  attendanceButton: {
    gridArea: "attendanceButton",
    justifySelf: "start",
  },
  eventTypeText: {
    color: theme.palette.grey[600],
  },
  eventTimeContainer: {
    gridArea: "eventTime",
    display: "grid",
    columnGap: theme.spacing(1),
    gridTemplateColumns: "3.75rem auto",
  },
  calendarIcon: {
    marginInlineStart: theme.spacing(-0.5),
    height: "3.75rem",
    width: "3.75rem",
  },
  eventDetailsContainer: {
    display: "grid",
    rowGap: theme.spacing(3),
    marginBlockEnd: theme.spacing(5),
  },
  cardSection: {
    padding: theme.spacing(2),
    "& + &": {
      marginBlockStart: theme.spacing(3),
    },
  },
}));

export default function EventPage() {
  const classes = useEventPageStyles();
  const history = useHistory();
  const { eventId: rawEventId, eventSlug } =
    useParams<{ eventId: string; eventSlug?: string }>();

  const eventId = +rawEventId;
  const isValidEventId = !isNaN(eventId) && eventId > 0;
  const queryClient = useQueryClient();
  const {
    data: event,
    error: eventError,
    isLoading,
  } = useQuery<Event.AsObject, GrpcError>({
    queryKey: eventKey(eventId),
    queryFn: () => service.events.getEvent(eventId),
    enabled: isValidEventId,
  });

  const {
    isLoading: isSetEventAttendanceLoading,
    error: setEventAttendanceError,
    mutate: setEventAttendance,
  } = useMutation<Event.AsObject, GrpcError, AttendanceState>(
    (currentAttendanceState) => {
      const attendanceStateToSet =
        currentAttendanceState === AttendanceState.ATTENDANCE_STATE_GOING
          ? AttendanceState.ATTENDANCE_STATE_NOT_GOING
          : AttendanceState.ATTENDANCE_STATE_GOING;
      return service.events.setEventAttendance({
        attendanceState: attendanceStateToSet,
        eventId,
      });
    },
    {
      onSuccess(updatedEvent) {
        queryClient.setQueryData<Event.AsObject>(
          eventKey(eventId),
          updatedEvent
        );
        queryClient.invalidateQueries(eventKey(eventId));
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) =>
            queryKey[0] === eventAttendeesBaseKey &&
            isEventUsersInputType(queryKey[1]) &&
            queryKey[1].eventId === eventId,
        });
      },
    }
  );

  useEffect(() => {
    if (event?.slug && event.slug !== eventSlug) {
      history.replace(routeToEvent(event.eventId, event.slug));
    }
  }, [event, eventSlug, history]);

  return !isValidEventId ? (
    <NotFoundPage />
  ) : (
    <>
      {(eventError || setEventAttendanceError) && (
        <Alert severity="error">
          {eventError?.message || setEventAttendanceError?.message || ""}
        </Alert>
      )}
      {isLoading ? (
        <CircularProgress />
      ) : (
        event && (
          <>
            <div className={classes.header}>
              <HeaderButton
                className={classes.backButton}
                onClick={() => history.goBack()}
              >
                <BackIcon />
              </HeaderButton>
              <div className={classes.eventTitle}>
                <Typography variant="h1">{event.title}</Typography>
                <Typography className={classes.eventTypeText} variant="body1">
                  {event.onlineInformation
                    ? VIRTUAL_EVENT
                    : event.offlineInformation?.address}
                </Typography>
              </div>
              <Button
                className={classes.attendanceButton}
                loading={isSetEventAttendanceLoading}
                onClick={() => setEventAttendance(event.attendanceState)}
              >
                {event.attendanceState ===
                AttendanceState.ATTENDANCE_STATE_GOING
                  ? NOT_GOING
                  : GOING}
              </Button>
              <div className={classes.eventTimeContainer}>
                <CalendarIcon className={classes.calendarIcon} />
                <div>
                  <Typography variant="body1">
                    {dayjs(timestamp2Date(event.startTime!)).format("LLLL")}
                  </Typography>
                  <Typography variant="body1">{TO}</Typography>
                  <Typography variant="body1">
                    {dayjs(timestamp2Date(event.endTime!)).format("LLLL")}
                  </Typography>
                </div>
              </div>
            </div>
            <div className={classes.eventDetailsContainer}>
              <Card className={classes.cardSection}>
                <Typography variant="h2">{DETAILS}</Typography>
                <Markdown source={event.content} topHeaderLevel={3} />
              </Card>
              <EventOrganisers eventId={event.eventId} />
              <EventAttendees eventId={event.eventId} />
            </div>
          </>
        )
      )}
    </>
  );
}
