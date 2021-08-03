import {
  Card,
  CardContent,
  CardMedia,
  Chip,
  Theme,
  Typography,
} from "@material-ui/core";
import classNames from "classnames";
import { AttendeesIcon, CalendarIcon } from "components/Icons";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import LinesEllipsis from "react-lines-ellipsis";
import { Link } from "react-router-dom";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import { getAttendeesCount, ONLINE } from "../constants";
import getContentSummary from "../getContentSummary";
import { details, VIEW_DETAILS_FOR_LINK } from "./constants";
import eventImagePlaceholder from "./eventImagePlaceholder.svg";

const useStyles = makeStyles<Theme, { eventImageSrc: string }>((theme) => ({
  root: {
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
  },
  image: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[200],
    height: 80,
    backgroundImage: ({ eventImageSrc }) => `url(${eventImageSrc})`,
    backgroundSize: ({ eventImageSrc }) =>
      eventImageSrc === eventImagePlaceholder ? "contain" : "cover",
    [theme.breakpoints.up("sm")]: {
      height: 100,
    },
    [theme.breakpoints.up("md")]: {
      height: 120,
    },
  },
  chip: {
    borderRadius: theme.shape.borderRadius,
    fontWeight: "bold",
  },
  title: {
    ...theme.typography.h2,
    height: `calc(2 * calc(${theme.typography.h2.lineHeight} * ${theme.typography.h2.fontSize}))`,
    marginBottom: 0,
    marginTop: 0,
  },
  subtitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.grey[600],
    fontWeight: "bold",
  },
  icon: {
    display: "block",
    fontSize: "1rem",
    marginInlineEnd: theme.spacing(0.5),
  },
  detailsList: {
    "& > li": {
      alignItems: "center",
      display: "flex",
    },
    "ul&": {
      listStyle: "none",
      margin: 0,
      padding: 0,
    },
  },
  detailsText: {
    ...theme.typography.body2,
    color: theme.palette.secondary.main,
    fontWeight: "bold",
  },
  otherInfoSection: {
    marginTop: theme.spacing(1),
  },
}));

export const EVENT_CARD_TEST_ID = "event-card";
export interface EventCardProps {
  event: Event.AsObject;
  className?: string;
}

export default function EventCard({ event, className }: EventCardProps) {
  const classes = useStyles({
    eventImageSrc: event.photoUrl || eventImagePlaceholder,
  });

  const startTime = dayjs(timestamp2Date(event.startTime!));
  const endTime = dayjs(timestamp2Date(event.endTime!));

  const truncatedContent = useMemo(
    () => getContentSummary({ originalContent: event.content, maxLength: 200 }),
    [event.content]
  );

  return (
    <Card
      className={classNames(className, classes.root)}
      data-testid={EVENT_CARD_TEST_ID}
    >
      <Link to={routeToEvent(event.eventId, event.slug)}>
        <CardMedia
          src={event.photoUrl || eventImagePlaceholder}
          className={classes.image}
        >
          {event.onlineInformation && (
            <Chip className={classes.chip} size="medium" label={ONLINE} />
          )}
        </CardMedia>
        <CardContent>
          <LinesEllipsis
            maxLine={2}
            text={event.title}
            component="h3"
            className={classes.title}
          />
          <Typography className={classes.subtitle} variant="body2">
            {event.offlineInformation
              ? event.offlineInformation.address
              : VIEW_DETAILS_FOR_LINK}
          </Typography>
          <ul className={classes.detailsList}>
            <li>
              <CalendarIcon className={classes.icon} />
              <Typography variant="body1" noWrap>
                {`${startTime.format("LLL")} - ${endTime.format(
                  endTime.isSame(startTime, "day") ? "LT" : "LLL"
                )}`}
              </Typography>
            </li>
            <li>
              <AttendeesIcon className={classes.icon} />
              <Typography variant="body1">
                {getAttendeesCount(event.goingCount + event.maybeCount)}
              </Typography>
            </li>
          </ul>
          <div className={classes.otherInfoSection}>
            <Typography variant="h4">{details({ colon: true })}</Typography>
            <Typography variant="body1">{truncatedContent}</Typography>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
