import {
  Card,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import { AvatarGroup } from "@material-ui/lab";
import Avatar from "components/Avatar";
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
import { SUMMARY_QUERY_PAGE_SIZE, useEventAttendees } from "./hooks";

const useStyles = makeStyles((theme) => ({
  overviewRoot: {
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
    padding: theme.spacing(1),
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(2),
    },
  },
  overviewContent: {
    display: "grid",
    gap: theme.spacing(1),
    gridTemplateAreas: `
      "titles image"
      "content attendees"
    `,
    gridTemplateColumns: "2fr 1fr",
  },
  eventInfoContainer: {
    gridArea: "titles",
  },
  eventTimeContainer: {
    marginBlockStart: theme.spacing(1),
  },
  eventTime: {
    fontWeight: "bold",
  },
  rightContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  attendeesAndInfo: {
    gridArea: "attendees",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  image: {
    objectFit: "contain",
    height: 80,
    [theme.breakpoints.up("md")]: {
      height: 120,
    },
    width: "100%",
    gridArea: "image",
  },
  onlineOrOfflineInfo: {
    fontWeight: "bold",
    margin: `${theme.spacing(1)} 0`,
    textAlign: "center",
  },
  content: {
    gridArea: "content",
  },
  avatarGroup: {
    "& .MuiAvatarGroup-avatar": {
      border: 0,
    },
  },
  avatar: {
    height: 40,
    width: 40,
  },
}));

export interface LongEventCardProps {
  event: Event.AsObject;
}

export default function LongEventCard({ event }: LongEventCardProps) {
  const classes = useStyles();
  const theme = useTheme();
  const isBelowLg = useMediaQuery(theme.breakpoints.down("md"));

  const truncatedContent = useMemo(
    () =>
      getContentSummary({
        originalContent: event.content,
        maxLength: isBelowLg ? 120 : 300,
      }),
    [event.content, isBelowLg]
  );
  const startTime = dayjs(timestamp2Date(event.startTime!));
  const endTime = dayjs(timestamp2Date(event.endTime!));
  const isSameDay = endTime.isSame(startTime, "day");

  const { attendees, attendeesIds, isAttendeesLoading } = useEventAttendees({
    eventId: event.eventId,
    type: "summary",
  });

  return (
    <Card className={classes.overviewRoot}>
      <Link
        className={classes.overviewContent}
        to={routeToEvent(event.eventId, event.slug)}
      >
        <div className={classes.eventInfoContainer}>
          <Typography variant="h2">{event.title}</Typography>
          <div className={classes.eventTimeContainer}>
            <Typography className={classes.eventTime} variant="body1">
              {startTime.format("ll")}
            </Typography>
            <Typography className={classes.eventTime} variant="body1">
              {`${startTime.format("LT")} ${TO} ${endTime.format(
                isSameDay ? "LT" : "lll"
              )}`}
            </Typography>
          </div>
        </div>
        <Typography className={classes.content} variant="body1">
          {truncatedContent}
        </Typography>
        <img
          alt=""
          className={classes.image}
          src={event.photoUrl || eventImagePlaceholder}
        />
        <div className={classes.attendeesAndInfo}>
          <Typography
            className={classes.onlineOrOfflineInfo}
            color="primary"
            variant="body1"
          >
            {event.offlineInformation
              ? event.offlineInformation.address
              : ONLINE}
          </Typography>
          <Typography variant="body1">
            {getAttendeesCount(event.goingCount)}
          </Typography>
          {isAttendeesLoading ? (
            <CircularProgress />
          ) : (
            attendees && (
              <AvatarGroup className={classes.avatarGroup} max={4}>
                {attendeesIds.map((attendeeUserId) => {
                  const attendee = attendees.get(attendeeUserId);
                  return (
                    <Avatar
                      className={classes.avatar}
                      isProfileLink={false}
                      key={attendeeUserId}
                      user={attendee}
                    />
                  );
                })}
                {/* For more than 5 users (SUMMARY_QUERY_PAGE_SIZE), generate dummy components so
                  AvatarGroup can use the total number of children to figure out what to display for +x
                  (but doesn't actually render the extra components to DOM) */}
                {event.goingCount > SUMMARY_QUERY_PAGE_SIZE
                  ? Array.from(
                      { length: event.goingCount - SUMMARY_QUERY_PAGE_SIZE },
                      (_, i) => <div key={i} />
                    )
                  : null}
              </AvatarGroup>
            )
          )}
        </div>
      </Link>
    </Card>
  );
}
