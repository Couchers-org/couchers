import {
  Card,
  CardContent,
  CardMedia,
  Chip,
  Theme,
  Typography,
} from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import classNames from "classnames";
import Divider from "components/Divider";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { routeToEvent } from "routes";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";
import stripMarkdown from "utils/stripMarkdown";

const useStyles = makeStyles<Theme, { eventImageSrc: string }>((theme) => ({
  root: {
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
  },
  cancelledChip: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white,
    fontWeight: "bold",
  },
  cancelledEvent: {
    opacity: 0.6,
    backgroundColor: theme.palette.grey[200],
  },
  image: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[200],
    height: 80,
    backgroundImage: ({ eventImageSrc }) => `url(${eventImageSrc})`,
    backgroundSize: ({ eventImageSrc }) =>
      eventImageSrc === eventImagePlaceholderUrl ? "contain" : "cover",
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
    display: "-webkit-box",
    boxOrient: "vertical",
    lineClamp: 2,
    overflow: "hidden",
  },
  eventTime: {
    display: "-webkit-box",
    boxOrient: "vertical",
    lineClamp: 2,
    overflow: "hidden",
    [theme.breakpoints.up("sm")]: {
      lineClamp: 1,
    },
  },
  content: {
    display: "-webkit-box",
    boxOrient: "vertical",
    lineClamp: 5,
    overflow: "hidden",
  },
}));

export const EVENT_CARD_TEST_ID = "event-card";
export interface EventCardProps {
  event: Event.AsObject;
  className?: string;
}

export default function EventCard({ event, className }: EventCardProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = useStyles({
    eventImageSrc: event.photoUrl || eventImagePlaceholderUrl,
  });

  const startTime = dayjs(timestamp2Date(event.startTime!));
  const endTime = dayjs(timestamp2Date(event.endTime!));

  const strippedContent = useMemo(
    () => stripMarkdown(event.content),
    [event.content]
  );

  const formattedEventDates = `${startTime.format("llll")} - ${endTime.format(
    endTime.isSame(startTime, "day") ? "LT" : "llll"
  )}`;

  return (
    <Card
      className={classNames(
        className,
        classes.root,
        event.isCancelled ? classes.cancelledEvent : null
      )}
      data-testid={EVENT_CARD_TEST_ID}
    >
      <Link href={routeToEvent(event.eventId, event.slug)}>
        <a>
          <CardMedia
            src={event.photoUrl || eventImagePlaceholderUrl}
            className={classes.image}
          >
            {event.onlineInformation && (
              <Chip
                className={classes.chip}
                size="medium"
                label={t("communities:online")}
              />
            )}
          </CardMedia>

          <CardContent>
            <Typography
              variant="body2"
              color="textSecondary"
              className={classes.eventTime}
              gutterBottom
              /* title useful to hover in case it's too long for the card */
              title={formattedEventDates}
            >
              {formattedEventDates}
            </Typography>

            <Typography variant="h3" gutterBottom className={classes.title}>
              {event.title}
            </Typography>
            <Typography noWrap variant="body2" gutterBottom>
              {event.offlineInformation
                ? event.offlineInformation.address
                : t("communities:virtual_event_location_placeholder")}
            </Typography>

            {event.isCancelled && (
              <Chip
                classes={{ root: classes.cancelledChip }}
                label={t("communities:cancelled")}
              />
            )}

            <Divider spacing={1} />

            <div>
              <Typography className={classes.content} variant="body1" paragraph>
                {strippedContent}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                {t("communities:attendees_count", {
                  count: event.goingCount + event.maybeCount,
                })}
              </Typography>
            </div>
          </CardContent>
        </a>
      </Link>
    </Card>
  );
}
