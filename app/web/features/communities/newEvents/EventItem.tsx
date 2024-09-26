import {
  Card,
  CardContent,
  CardMedia,
  Theme,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { eventImagePlaceholderUrl } from "appConstants";
import Pill from "components/Pill";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { routeToEvent } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    margin: 0,
    "&:not(:first-child)": {
      margin: theme.spacing(2, 0),
    },
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.spacing(1),
  },
  attendees: {
    display: "flex",
    alignItems: "flex-end",
  },
  card: {
    display: "flex",
    width: "100%",
    height: theme.spacing(20),
  },
  cardMedia: {
    height: "100%",
    width: "25%",
    objectFit: "fill",
  },
  cardContent: {
    width: "75%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  eventInfo: {
    display: "flex",
    justifyContent: "flex-end",
    flexDirection: "column",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
  tags: {
    minWidth: theme.spacing(15),
  },
  title: {
    display: "-webkit-box",
    lineClamp: 2,
    boxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxHeight: "3em" /* Approximate height for 2 lines of text */,
    lineHeight: "1.5em",
    paddingRight: theme.spacing(2),
  },
}));

const EventItem = ({
  event,
  userId,
}: {
  event: Event.AsObject;
  userId: number | null | undefined;
}) => {
  const classes = useStyles({
    eventImageSrc: event.photoUrl || eventImagePlaceholderUrl,
  });
  const { t } = useTranslation([COMMUNITIES]);

  const startTime = dayjs(timestamp2Date(event.startTime!)).format("llll");

  const renderTags = () => {
    const isCreatedByMe = event.creatorUserId === userId;
    const isOnline = event.onlineInformation?.link !== undefined;
    const isCancelled = event.isCancelled;

    return (
      <div className={classes.tags}>
        {isCreatedByMe && (
          <Pill variant="rounded">{t("communities:created_by_me")}</Pill>
        )}
        {isOnline && <Pill variant="rounded">{t("communities:online")}</Pill>}
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
    );
  };

  return (
    <Card className={classes.root}>
      <Link href={routeToEvent(event.eventId, event.slug)}>
        <a className={classes.card}>
          <CardMedia
            className={classes.cardMedia}
            component="img"
            image={event.photoUrl || eventImagePlaceholderUrl}
          />
          <CardContent className={classes.cardContent}>
            <div className={classes.row}>
              <Tooltip title={event.title}>
                <Typography variant="h3" className={classes.title}>
                  {event.title}
                </Typography>
              </Tooltip>
              {renderTags()}
            </div>
            <div className={classes.row}>
              <div className={classes.eventInfo}>
                <Typography noWrap variant="body2">
                  {event.offlineInformation
                    ? event.offlineInformation.address
                    : t("communities:virtual_event_location_placeholder")}
                </Typography>
                <Typography variant="body2">{startTime}</Typography>
              </div>
              <Typography
                className={classes.attendees}
                variant="body2"
                color="textSecondary"
              >
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
};

export default EventItem;
