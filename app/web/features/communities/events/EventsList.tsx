import { useAuthContext } from "features/auth/AuthProvider";
import { Event } from "proto/events_pb";
import makeStyles from "utils/makeStyles";

import EventCard from "./EventCard";
import LongEventCard from "./LongEventCard";

interface EventListProps {
  events: Event.AsObject[];
  isVerticalStyle?: boolean;
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
            padding: theme.spacing(2),

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

const DEFAULT_EVENTS: Event.AsObject[] = [];

const EventsList = ({
  events = DEFAULT_EVENTS,
  isVerticalStyle = false,
}: EventListProps) => {
  const classes = useStyles({ isVerticalStyle });

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
            <LongEventCard key={event.eventId} event={event} userId={userId} />
          )
        )}
      </div>
    </div>
  );
};

export default EventsList;
