import {
  Card,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
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
import { getExtraAvatarCountText } from "./constants";
import eventImagePlaceholder from "./eventImagePlaceholder.svg";
import { useEventAttendees } from "./hooks";

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
    gridTemplateColumns: "1fr 1fr",
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "2fr 1fr",
    },
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
    "& > $avatar:nth-child(n+2)": {
      marginInlineStart: theme.spacing(-1),
    },
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    height: 40,
    width: 40,
  },
  extraAvatarCount: {
    marginInlineStart: theme.spacing(1),
  },
}));

export const AVATAR_GROUP_TEST_ID = "avatar-group";

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
  const extraAvatarCount = event.goingCount - Math.min(3, attendeesIds.length);

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
            attendees &&
            attendeesIds.length > 0 && (
              <div
                className={classes.avatarGroup}
                data-testid={AVATAR_GROUP_TEST_ID}
              >
                {attendeesIds.slice(0, 3).map((attendeeUserId) => {
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
                {extraAvatarCount > 0 && (
                  <Typography
                    className={classes.extraAvatarCount}
                    variant="body1"
                  >
                    {getExtraAvatarCountText(extraAvatarCount)}
                  </Typography>
                )}
              </div>
            )
          )}
        </div>
      </Link>
    </Card>
  );
}
