import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { Community } from "proto/communities_pb";
import { useHistory } from "react-router-dom";
import { newEventRoute } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { SectionTitle, useCommunityPageStyles } from "../CommunityPage";
import { useListCommunityEvents } from "../hooks";
import {
  CREATE_AN_EVENT,
  EVENTS_EMPTY_STATE,
  EVENTS_TITLE,
  SEE_MORE_EVENTS_LABEL,
} from "./constants";
import LongEventCard from "./LongEventCard";

interface EventsListProps {
  community: Community.AsObject;
}

const useStyles = makeStyles((theme) => ({
  eventsListContainer: {
    display: "grid",
    rowGap: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      //break out of page padding
      left: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      position: "relative",
      right: "50%",
      width: "100vw",
    },
    marginBlockEnd: theme.spacing(2),
  },
}));

export default function EventsList({ community }: EventsListProps) {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const history = useHistory();

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListCommunityEvents({
      communityId: community.communityId,
      pageSize: 5,
      type: "all",
    });

  return (
    <>
      <SectionTitle icon={<CalendarIcon />}>{EVENTS_TITLE}</SectionTitle>
      <Button
        className={classes.createResourceButton}
        onClick={() =>
          history.push(newEventRoute, { communityId: community.communityId })
        }
      >
        {CREATE_AN_EVENT}
      </Button>
      {error && <Alert severity="error">{error.message}</Alert>}
      <div className={classes.eventsListContainer}>
        {isLoading ? (
          <CircularProgress />
        ) : hasAtLeastOnePage(data, "eventsList") ? (
          data.pages
            .flatMap((page) => page.eventsList)
            .map((event) => <LongEventCard event={event} key={event.eventId} />)
        ) : (
          !error && <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
        )}
      </div>
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()}>{SEE_MORE_EVENTS_LABEL}</Button>
      )}
    </>
  );
}
