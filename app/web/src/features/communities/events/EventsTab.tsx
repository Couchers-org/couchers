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
  root: {
    display: "grid",
    rowGap: theme.spacing(2),
    paddingBlockStart: theme.spacing(1),
    paddingBlockEnd: theme.spacing(5),
    justifyItems: "start",
  },
  container: {
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
      gridGap: theme.spacing(2),
    },
    display: "grid",
  },
  eventsCard: {
    width: "100%",
  },
  moreEventButton: {
    justifySelf: "center",
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
    <div className={classes.root}>
      <Typography variant="h2">{tabTitle}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {!pastEvents && (
        <Button onClick={() => history.push(newEventRoute)}>
          {CREATE_AN_EVENT}
        </Button>
      )}
      {isLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <div className={classNames(classes.cardContainer, classes.container)}>
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
            <Button
              className={classes.moreEventButton}
              onClick={() => fetchNextPage()}
            >
              {SEE_MORE_EVENTS_LABEL}
            </Button>
          )}
        </>
      ) : (
        !error && <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
      )}
    </div>
  );
}
