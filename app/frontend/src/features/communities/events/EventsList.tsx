import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { SEE_MORE_EVENTS_LABEL } from "features/constants";
import { Community } from "proto/communities_pb";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { SectionTitle } from "../CommunityPage";
import { EVENTS_EMPTY_STATE, EVENTS_TITLE } from "../constants";
import { useListCommunityEvents } from "../hooks";
import EventCardLong from "./EventCardLong";

interface EventsListProps {
  community: Community.AsObject;
}

const useStyles = makeStyles((theme) => ({
  eventsListContainer: {
    display: "grid",
    rowGap: theme.spacing(3),
    [theme.breakpoints.up("sm")]: {
      margin: `${theme.spacing(1)} auto 0`,
      width: "70%",
    },
  },
}));

export default function EventsList({ community }: EventsListProps) {
  const classes = useStyles();

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListCommunityEvents({
      communityId: community.communityId,
      type: "all",
    });

  return (
    <>
      <SectionTitle icon={<CalendarIcon />}>{EVENTS_TITLE}</SectionTitle>
      {error && <Alert severity="error">{error.message}</Alert>}
      <div className={classes.eventsListContainer}>
        {isLoading ? (
          <CircularProgress />
        ) : hasAtLeastOnePage(data, "eventsList") ? (
          data.pages
            .flatMap((page) => page.eventsList)
            .map((event) => <EventCardLong event={event} key={event.eventId} />)
        ) : (
          <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
        )}
      </div>
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()}>{SEE_MORE_EVENTS_LABEL}</Button>
      )}
    </>
  );
}
