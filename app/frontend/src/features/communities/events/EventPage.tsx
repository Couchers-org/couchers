import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import HeaderButton from "components/HeaderButton";
import { BackIcon, CalendarIcon } from "components/Icons";
import Markdown from "components/Markdown";
import { TO } from "features/constants";
import NotFoundPage from "features/NotFoundPage";
import { Error as GrpcError } from "grpc-web";
import { Event } from "proto/events_pb";
import { eventKey } from "queryKeys";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { useHistory, useParams } from "react-router-dom";
import { routeToEvent } from "routes";
import { service } from "service";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import { ATTENDEES, DETAILS, VIRTUAL_EVENT } from "./constants";
import EventOrganisers from "./EventOrganisers";

const useStyles = makeStyles((theme) => ({
  header: {
    alignItems: "center",
    gap: theme.spacing(2, 2),
    display: "grid",
    gridTemplateAreas: `
      "backButton eventTitle"
      ". eventTime"
    `,
    gridAutoFlow: "column",
    gridTemplateColumns: "3.125rem 1fr",
    marginBlockEnd: theme.spacing(4),
    marginBlockStart: theme.spacing(2),
  },
  backButton: {
    gridArea: "backButton",
    width: "3.125rem",
    height: "3.125rem",
  },
  eventTitle: {
    gridArea: "eventTitle",
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
  },
  cardSection: {
    padding: theme.spacing(2),
    "& + &": {
      marginBlockStart: theme.spacing(3),
    },
  },
}));

export default function EventPage() {
  const classes = useStyles();
  const history = useHistory();
  const { eventId: rawEventId, eventSlug } =
    useParams<{ eventId: string; eventSlug?: string }>();

  const eventId = +rawEventId;
  const isValidEventId = !isNaN(eventId) && eventId > 0;
  const {
    data: event,
    error,
    isLoading,
  } = useQuery<Event.AsObject, GrpcError>({
    queryKey: eventKey(eventId),
    queryFn: () => service.events.getEvent(eventId),
    enabled: isValidEventId,
  });

  useEffect(() => {
    if (event?.slug && event.slug !== eventSlug) {
      history.replace(routeToEvent(event.eventId, event.slug));
    }
  }, [event, eventSlug, history]);

  return !isValidEventId ? (
    <NotFoundPage />
  ) : (
    <>
      {error && <Alert severity="error">{error.message}</Alert>}
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
                {/* TODO: Add going button - SetEventAttendance rpc */}
                <Typography className={classes.eventTypeText} variant="body1">
                  {event.onlineInformation
                    ? VIRTUAL_EVENT
                    : event.offlineInformation?.address}
                </Typography>
              </div>
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
              {/* Break this into separate component? */}
              <Card className={classes.cardSection}>
                <Typography variant="h2">{ATTENDEES}</Typography>
                {/* TODO: use ListEventAttendees rpc to get this */}
              </Card>
            </div>
          </>
        )
      )}
    </>
  );
}
