import {
  Card,
  CardContent,
  CardMedia,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { eventImagePlaceholderUrl } from "appConstants";
import { AttendeesIcon, CalendarIcon } from "components/Icons";
import Pill from "components/Pill";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { useMemo } from "react";
import { routeToEvent } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

import getContentSummary from "../getContentSummary";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    margin: 0,
    "&:not(:first-child)": {
      margin: theme.spacing(2, 0),
    },
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    [theme.breakpoints.up("sm")]: {
      padding: theme.spacing(2),
    },
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
  },
  card: {
    display: "flex",
    width: "100%",
    height: theme.spacing(20),
    [theme.breakpoints.down("sm")]: {
      height: "auto",
    },
  },
  cardMedia: {
    height: "100%",
    width: "25%",
    objectFit: "fill",
  },
  cardContent: {
    width: "75%",
    display: "flex",
    padding: "0  !important",
    flexDirection: "column",
    justifyContent: "space-between",
    [theme.breakpoints.down("sm")]: {
      width: "100%",
      "& .MuiTypography-root": {
        fontSize: "0.75rem",
      },
      "& .MuiTypography-h2": {
        fontSize: "1rem",
      },
    },
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
  location: {
    fontWeight: "bold",
    color: theme.palette.grey[600],
  },
  icon: {
    display: "block",
    fontSize: "1.25rem",
    lineHeight: 1.5,
    marginInlineEnd: theme.spacing(0.5),
  },
  eventTimeContainer: {
    alignItems: "center",
    display: "flex",
  },
  attendeesCountContainer: {
    alignItems: "center",
    display: "flex",
  },
  tags: {
    minWidth: theme.spacing(15),
    [theme.breakpoints.down("sm")]: {
      "& > *": {
        fontSize: "0.5rem",
      },
    },
  },
}));

const LongEventCard = ({
  event,
  userId,
}: {
  event: Event.AsObject;
  userId?: number | null | undefined;
}) => {
  const classes = useStyles({
    eventImageSrc: event.photoUrl || eventImagePlaceholderUrl,
  });
  const { t } = useTranslation([COMMUNITIES]);
  const isBelowLg = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const truncatedContent = useMemo(
    () =>
      getContentSummary({
        originalContent: event.content,
        maxLength: isBelowLg ? 120 : 300,
      }),
    [event.content, isBelowLg],
  );
  const startTime = dayjs(timestamp2Date(event.startTime!)).format("llll");
  const isCreatedByMe = event.creatorUserId === userId;
  const isOnline = event.onlineInformation?.link !== undefined;
  const isCancelled = event.isCancelled;

  return (
    <Card className={classes.root} data-testid="event-item">
      <Link
        href={routeToEvent(event.eventId, event.slug)}
        className={classes.card}
      >
        <CardMedia
          className={classes.cardMedia}
          component="img"
          image={event.photoUrl || eventImagePlaceholderUrl}
        />
        <CardContent className={classes.cardContent}>
          <div className={classes.row}>
            <div>
              <Typography variant="h2">{event.title}</Typography>
              <Typography className={classes.location} variant="body1">
                {event.offlineInformation
                  ? event.offlineInformation.address
                  : t("communities:virtual_event_location_placeholder")}
              </Typography>
            </div>
            <div className={classes.tags}>
              {isCreatedByMe && (
                <Pill variant="rounded">{t("communities:created_by_me")}</Pill>
              )}
              {isOnline && (
                <Pill variant="rounded">{t("communities:online")}</Pill>
              )}
              {isCancelled && (
                <Pill
                  backgroundColor={theme.palette.error.main}
                  color={theme.palette.common.white}
                  variant="rounded"
                >
                  {t("communities:cancelled")}
                </Pill>
              )}
            </div>
          </div>
          <div>
            <div className={classes.eventTimeContainer}>
              <CalendarIcon className={classes.icon} />
              <Typography variant="body1">{startTime}</Typography>
            </div>
            <div className={classes.attendeesCountContainer}>
              <AttendeesIcon className={classes.icon} />
              <Typography variant="body1">
                {t("communities:attendees_count", {
                  count: event.goingCount + event.maybeCount,
                })}
              </Typography>
            </div>
          </div>
          {!isMobile && (
            <Typography variant="body1">{truncatedContent}</Typography>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default LongEventCard;
