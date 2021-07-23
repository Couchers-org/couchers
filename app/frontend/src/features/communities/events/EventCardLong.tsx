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
    padding: theme.spacing(2),
  },
  overviewContent: {
    display: "grid",
    gridTemplateAreas: `
      "titles image"
      "content content"
    `,
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "2fr 1fr",
    },
  },
  eventInfoContainer: {
    gridArea: "titles",
  },
  eventTimeContainer: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
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
    marginBottom: theme.spacing(3),
    color: theme.palette.grey[600],
    fontWeight: "bold",
  },
  image: {
    objectFit: "fill",
    height: 80,
    [theme.breakpoints.up("md")]: {
      height: 150,
    },
    width: "100%",
    gridArea: "image",
  },
  content: {
    gridArea: "content",
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
        maxLength: isBelowMd ? 120 : 300,
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
          <Typography className={classes.attendeesCount} variant="body1">
            {getAttendeesCount(event.goingCount)}
          </Typography>
        </div>
        <Typography className={classes.content} variant="body1">
          {truncatedContent}
        </Typography>
        <img
          alt=""
          className={classes.image}
          src={event.photoUrl || eventImagePlaceholder}
        />
      </Link>
    </Card>
  );
}
