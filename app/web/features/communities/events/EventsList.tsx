import { styled } from "@mui/material";
import { useAuthContext } from "features/auth/AuthProvider";
import { Event } from "proto/events_pb";

import EventCard from "./EventCard";
import LongEventCard from "./LongEventCard";

interface EventListProps {
  events: Event.AsObject[];
  isVerticalStyle?: boolean;
}

const StyledRoot = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  rowGap: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    rowGap: theme.spacing(1.5),
  },
}));

const StyledVerticalStyleContainer = styled("div")(({ theme }) => ({
  display: "grid",

  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
    gap: theme.spacing(2),
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
    gap: theme.spacing(2),
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(3),
  },
}));

const DEFAULT_EVENTS: Event.AsObject[] = [];

const EventsList = ({
  events = DEFAULT_EVENTS,
  isVerticalStyle = false,
}: EventListProps) => {
  const {
    authState: { userId },
  } = useAuthContext();

  return (
    <StyledRoot>
      {isVerticalStyle ? (
        <StyledVerticalStyleContainer>
          {events.map((event) => (
            <EventCard key={event.eventId} event={event} />
          ))}
        </StyledVerticalStyleContainer>
      ) : (
        events.map((event) => (
          <LongEventCard key={event.eventId} event={event} userId={userId} />
        ))
      )}
    </StyledRoot>
  );
};

export default EventsList;
