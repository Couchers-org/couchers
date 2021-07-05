import { Card, CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import HeaderButton from "components/HeaderButton";
import { BackIcon } from "components/Icons";
import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import UserSummary from "components/UserSummary";
import NotFoundPage from "features/NotFoundPage";
import { useUser } from "features/userQueries/useUsers";
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

import {
  ATTENDEES,
  DETAILS,
  getDisplayDates,
  ORGANISERS,
  VIRTUAL_EVENT,
} from "./constants";

const useStyles = makeStyles((theme) => ({
  header: {
    alignItems: "center",
    display: "flex",
    "& > * + *": {
      marginInlineStart: theme.spacing(2),
    },
  },
  eventTypeText: {
    color: theme.palette.grey[600],
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
  const { data: organiser } = useUser(event?.creatorUserId);

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
              <HeaderButton onClick={() => history.goBack()}>
                <BackIcon />
              </HeaderButton>
              <PageTitle>{event.title}</PageTitle>
            </div>
            {/* TODO: Add going button - SetEventAttendance rpc */}
            <Typography className={classes.eventTypeText} variant="body1">
              {event.onlineInformation
                ? VIRTUAL_EVENT
                : event.offlineInformation?.address}
            </Typography>
            <Typography variant="body1">
              {getDisplayDates({
                startDate: dayjs(timestamp2Date(event.startTime!)).format(
                  "LLLL"
                ),
                endDate: dayjs(timestamp2Date(event.endTime!)).format("LLLL"),
              })}
            </Typography>
            <Card className={classes.cardSection}>
              <Typography variant="h2">{DETAILS}</Typography>
              <Markdown source={event.content} topHeaderLevel={3} />
            </Card>
            {/* Break this into separate component? */}
            <Card className={classes.cardSection}>
              <Typography variant="h2">{ORGANISERS}</Typography>
              {/* TODO: use ListEventOrganisers rpc to get this */}
              <UserSummary nameOnly user={organiser} />
            </Card>
            {/* Break this into separate component? */}
            <Card className={classes.cardSection}>
              <Typography variant="h2">{ATTENDEES}</Typography>
              {/* TODO: use ListEventAttendees rpc to get this */}
            </Card>
          </>
        )
      )}
    </>
  );
}
