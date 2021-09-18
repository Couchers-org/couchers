import { Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import CircularProgress from "components/CircularProgress";
import TextBody from "components/TextBody";
import { useHistory } from "react-router-dom";
import { newEventRoute } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { useCommunityPageStyles } from "../CommunityPage";
import { EVENTS_EMPTY_STATE } from "../constants";
import { CREATE_AN_EVENT, SEE_MORE_EVENTS_LABEL } from "./constants";
import EventCard from "./EventCard";
import { useListAllEvents } from "./hooks";

const useStyles = makeStyles((theme) => ({
  title: {
    marginBlockEnd: theme.spacing(2),
  },
  container: {
    [theme.breakpoints.down("xs")]: {
      //break out of page padding
      left: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      position: "relative",
      right: "50%",
      width: "100vw",
    },
    display: "grid",
    gridTemplateColumns: "1fr",
    gridGap: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "repeat(3, 1fr)",
      gridGap: theme.spacing(3),
    },
  },
  eventsCard: {
    width: "100%",
  },
}));

interface EventsTabProps {
  pastEvents?: boolean;
  tabTitle: string;
}

export default function EventsTab({
  pastEvents = false,
  tabTitle,
}: EventsTabProps) {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const history = useHistory();

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListAllEvents({ pastEvents });

  return (
    <>
      {!pastEvents && (
        <Button
          className={classes.createResourceButton}
          onClick={() => history.push(newEventRoute)}
        >
          {CREATE_AN_EVENT}
        </Button>
      )}
      <Typography className={classes.title} variant="h2">
        {tabTitle}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <div className={classes.container}>
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  className={classNames(
                    classes.placeEventCard,
                    classes.eventsCard
                  )}
                />
              ))}
          </div>
          {hasNextPage && (
            <Button onClick={() => fetchNextPage()}>
              {SEE_MORE_EVENTS_LABEL}
            </Button>
          )}
        </>
      ) : (
        !error && <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
      )}
    </>
  );
}
