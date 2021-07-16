import { Card, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import { TO } from "features/constants";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import { getAttendeesCount, ONLINE } from "../constants";
import getContentSummary from "../getContentSummary";
import eventImagePlaceholder from "./eventImagePlaceholder.svg";

const useStyles = makeStyles((theme) => ({
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

interface EventCardLongProps {
  event: Event.AsObject;
}

export default function EventCardLong({ event }: EventCardLongProps) {
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
