import { CircularProgress, Link as MuiLink } from "@material-ui/core";
import Alert from "components/Alert";
import HorizontalScroller from "components/HorizontalScroller";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import {
  EVENTS_EMPTY_STATE,
  EVENTS_TITLE,
  SHOW_ALL_EVENTS,
} from "features/communities/constants";
import { Community } from "proto/communities_pb";
import { Link } from "react-router-dom";
import { routeToCommunity } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { SectionTitle, useCommunityPageStyles } from "../CommunityPage";
import { useListCommunityEvents } from "../hooks";
import EventCard from "./EventCard";

export default function EventsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useCommunityPageStyles();

  const { data, error, hasNextPage, isLoading } = useListCommunityEvents({
    communityId: community.communityId,
    pageSize: 3,
  });

  return (
    <>
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
    </>
  );
}
