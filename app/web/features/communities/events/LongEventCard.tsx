import {
  Card,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import { AttendeesIcon, CalendarIcon } from "components/Icons";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";
import Link from "next/link";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import { getAttendeesCount, ONLINE } from "../constants";
import getContentSummary from "../getContentSummary";
import eventImagePlaceholder from "./eventImagePlaceholder.svg";

const useStyles = makeStyles<Theme, { eventImageSrc: string }>((theme) => ({
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
      "content content"
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
    alignItems: "center",
    display: "flex",
    marginBlockStart: theme.spacing(1),
  },
  attendeesCountContainer: {
    alignItems: "center",
    display: "flex",
  },
  icon: {
    display: "block",
    fontSize: "1.25rem",
    lineHeight: 1.5,
    marginInlineEnd: theme.spacing(0.5),
  },
  image: {
    objectFit: ({ eventImageSrc }) =>
      eventImageSrc === eventImagePlaceholder ? "contain" : "cover",
    height: 80,
    [theme.breakpoints.up("md")]: {
      height: 120,
    },
    width: "100%",
    gridArea: "image",
  },
  onlineOrOfflineInfo: {
    fontWeight: "bold",
    color: theme.palette.grey[600],
  },
  content: {
    gridArea: "content",
  },
}));

export interface LongEventCardProps {
  event: Event.AsObject;
}

export default function LongEventCard({ event }: LongEventCardProps) {
  const classes = useStyles({
    eventImageSrc: event.photoUrl || eventImagePlaceholder,
  });
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

  return (
    <Card className={classes.overviewRoot}>
      <Link href={routeToEvent(event.eventId, event.slug)}>
        <a className={classes.overviewContent}>
          <div className={classes.eventInfoContainer}>
            <Typography variant="h2">{event.title}</Typography>
            <Typography
              className={classes.onlineOrOfflineInfo}
              color="primary"
              variant="body1"
            >
              {event.offlineInformation
                ? event.offlineInformation.address
                : ONLINE}
            </Typography>
            <div className={classes.eventTimeContainer}>
              <CalendarIcon className={classes.icon} />
              <Typography variant="body1">
                {startTime.format("ll LT")}
              </Typography>
            </div>
            <div className={classes.attendeesCountContainer}>
              <AttendeesIcon className={classes.icon} />
              <Typography variant="body1">
                {getAttendeesCount(event.goingCount + event.maybeCount)}
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
        </a>
      </Link>
    </Card>
  );
}
