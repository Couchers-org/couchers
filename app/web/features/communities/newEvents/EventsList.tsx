import Button from "components/Button";
import { useAuthContext } from "features/auth/AuthProvider";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Event } from "proto/events_pb";
import makeStyles from "utils/makeStyles";

import EventCard from "../events/EventCard";
import EventItem from "./EventItem";

interface EventListProps {
  events: Event.AsObject[];
  isVerticalStyle?: boolean;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  eventsContainer: (props: { isVerticalStyle: boolean }) =>
    props.isVerticalStyle
      ? {
          display: "grid",

          [theme.breakpoints.down("xs")]: {
            gridTemplateColumns: "1fr",
            gridGap: theme.spacing(2),
            //break out of page padding
            left: "50%",
            marginLeft: "-50vw",
            marginRight: "-50vw",
            position: "relative",
            right: "50%",
            width: "100vw",
          },
          [theme.breakpoints.up("sm")]: {
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridGap: theme.spacing(2),
          },
          [theme.breakpoints.up("md")]: {
            gridTemplateColumns: "repeat(3, 1fr)",
            gridGap: theme.spacing(3),
          },
        }
      : {},
  seeMoreContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(4),
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(4),
    },
  },
}));

const EventsList = ({
  events,
  isVerticalStyle = false,
  hasNextPage,
  fetchNextPage,
}: EventListProps) => {
  const classes = useStyles({ isVerticalStyle });
  const { t } = useTranslation([COMMUNITIES]);

  const {
    authState: { userId },
  } = useAuthContext();

  return (
    <div className={classes.root}>
      <div className={classes.eventsContainer}>
        {events.map((event) =>
          isVerticalStyle ? (
            <EventCard key={event.eventId} event={event} />
          ) : (
            <EventItem key={event.eventId} event={event} userId={userId} />
          )
        )}
      </div>
      <div className={classes.seeMoreContainer}>
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()}>
            {t("communities:see_more_events_label")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventsList;
