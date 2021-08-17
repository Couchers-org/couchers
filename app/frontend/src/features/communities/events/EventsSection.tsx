import { CircularProgress, Link as MuiLink } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HorizontalScroller from "components/HorizontalScroller";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { Community } from "proto/communities_pb";
import { Link, useHistory } from "react-router-dom";
import { newEventRoute, routeToCommunity } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { SectionTitle, useCommunityPageStyles } from "../CommunityPage";
import { useListCommunityEvents } from "../hooks";
import {
  CREATE_AN_EVENT,
  EVENTS_EMPTY_STATE,
  EVENTS_TITLE,
  SHOW_ALL_EVENTS,
} from "./constants";
import EventCard from "./EventCard";

const useStyles = makeStyles((theme) => ({
  section: {
    display: "grid",
    rowGap: theme.spacing(2),
  },
  centerSelf: {
    justifySelf: "center",
  },
}));

export default function EventsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const history = useHistory();

  const { data, error, hasNextPage, isLoading } = useListCommunityEvents({
    communityId: community.communityId,
    pageSize: 3,
    type: "summary",
  });

  return (
    <section className={classes.section}>
      <SectionTitle icon={<CalendarIcon />} variant="h2">
        {EVENTS_TITLE}
      </SectionTitle>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <HorizontalScroller className={classes.cardContainer}>
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  className={classes.placeEventCard}
                />
              ))}
          </HorizontalScroller>
          {hasNextPage && (
            <div className={classes.loadMoreButton}>
              <MuiLink
                component={Link}
                to={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "events"
                )}
              >
                {SHOW_ALL_EVENTS}
              </MuiLink>
            </div>
          )}
        </>
      ) : (
        !error && <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
      )}
      <Button
        className={classes.centerSelf}
        onClick={() =>
          history.push(newEventRoute, { communityId: community.communityId })
        }
      >
        {CREATE_AN_EVENT}
      </Button>
    </section>
  );
}
