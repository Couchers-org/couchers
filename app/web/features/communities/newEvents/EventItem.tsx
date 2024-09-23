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
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { Event } from "proto/events_pb";
import { routeToEvent } from "routes";
import { theme } from "theme";
import { timestamp2Date } from "utils/date";
import dayjs from "utils/dayjs";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme: Theme) => ({
  attendees: {
    display: "flex",
    alignItems: "flex-end",
  },
  card: {
    display: "flex",
    width: "100%",
    height: theme.spacing(20),
    margin: theme.spacing(2, 0, 2, 0),
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: theme.spacing(1),
  },
  cardMedia: {
    height: "100%",
    width: "25%",
    objectFit: "fill",
  },
  cardContent: {
    width: "75%",
    padding: theme.spacing(2, 4),
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
    gap: theme.spacing(1),
  },
  title: {
    display: "-webkit-box",
    boxOrient: "vertical",
    lineClamp: 2,
    overflow: "hidden",
  },
}));

const EventItem = ({ event }: { event: Event.AsObject }) => {
  const classes = useStyles({
    eventImageSrc: event.photoUrl || eventImagePlaceholderUrl,
  });
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);

  const startTime = dayjs(timestamp2Date(event.startTime!)).format("llll");

  const {
    authState: { userId },
  } = useAuthContext();

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
    <Card>
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
