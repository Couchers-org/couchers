import {
  Card,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { SEE_MORE_EVENTS_LABEL, TO } from "features/constants";
import { Community } from "proto/communities_pb";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { SectionTitle } from "../CommunityPage";
import {
  EVENTS_EMPTY_STATE,
  EVENTS_TITLE,
  getAttendeesCount,
  ONLINE,
} from "../constants";
import getContentSummary from "../getContentSummary";
import { useListCommunityEvents } from "../hooks";
import eventImagePlaceholder from "./eventImagePlaceholder.svg";

interface EventsListProps {
  community: Community.AsObject;
}

const useStyles = makeStyles((theme) => ({
  eventsListContainer: {
    display: "grid",
    rowGap: theme.spacing(3),
    [theme.breakpoints.up("sm")]: {
      margin: `${theme.spacing(1)} auto 0`,
      width: "70%",
    },
  },
  overviewRoot: {
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
  },
  overviewContent: {
    display: "grid",
    [theme.breakpoints.up("sm")]: {
      gridTemplateColumns: "2fr 1fr",
    },
  },
  eventInfoContainer: {
    padding: theme.spacing(2),
  },
  eventTimeContainer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  eventTime: {
    fontWeight: "bold",
  },
  rightContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  attendeesCount: {
    justifySelf: "center",
  },
  image: {
    objectFit: "contain",
    maxHeight: 120,
    width: "100%",
  },
}));

export default function EventsList({ community }: EventsListProps) {
  const classes = useStyles();

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListCommunityEvents({
      communityId: community.communityId,
      type: "all",
    });

  return (
    <>
      <SectionTitle icon={<CalendarIcon />}>{EVENTS_TITLE}</SectionTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      <div className={classes.eventsListContainer}>
        {isLoading ? (
          <CircularProgress />
        ) : hasAtLeastOnePage(data, "eventsList") ? (
          data.pages
            .flatMap((page) => page.eventsList)
            .map((event) => <EventCardLong event={event} key={event.eventId} />)
        ) : (
          <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
        )}
      </div>
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()}>{SEE_MORE_EVENTS_LABEL}</Button>
      )}
    </>
  );
}

interface EventOverviewProps {
  event: Event.AsObject;
}

function EventCardLong({ event }: EventOverviewProps) {
  const classes = useStyles();
  const theme = useTheme();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("xs"));

  const truncatedContent = useMemo(
    () =>
      getContentSummary({
        originalContent: event.content,
        maxLength: isBelowMd ? 100 : 300,
      }),
    [event.content, isBelowMd]
  );
  const startTime = dayjs(timestamp2Date(event.startTime!));
  const endTime = dayjs(timestamp2Date(event.endTime!));
  const isSameDay = endTime.isSame(startTime, "day");

  return (
    <Card className={classes.overviewRoot}>
      <Link
        className={classes.overviewContent}
        to={routeToEvent(event.eventId, event.slug)}
      >
        <div className={classes.eventInfoContainer}>
          <Typography variant="h2">{event.title}</Typography>
          <div className={classes.eventTimeContainer}>
            <Typography
              className={classes.eventTime}
              color="primary"
              variant="body1"
            >
              {event.offlineInformation
                ? event.offlineInformation.address
                : ONLINE}
            </Typography>
            <Typography className={classes.eventTime} variant="body1">
              {startTime.format("ll")}
            </Typography>
            <Typography className={classes.eventTime} variant="body1">
              {`${startTime.format("LT")} ${TO} ${endTime.format(
                isSameDay ? "LT" : "lll"
              )}`}
            </Typography>
          </div>
          <Typography variant="body1">{truncatedContent}</Typography>
        </div>
        <div className={classes.rightContainer}>
          {/* todo: need a better placeholder image... */}
          {!isBelowMd && (
            <img
              alt=""
              className={classes.image}
              src={event.photoUrl || eventImagePlaceholder}
            />
          )}
          <Typography className={classes.attendeesCount} variant="body1">
            {getAttendeesCount(event.goingCount)}
          </Typography>
        </div>
      </Link>
    </Card>
  );
}
