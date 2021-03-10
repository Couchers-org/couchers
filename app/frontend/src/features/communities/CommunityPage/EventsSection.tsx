import HorizontalScroller from "components/HorizontalScroller";
import IconButton from "components/IconButton";
import { CalendarIcon, MoreIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { EVENTS_EMPTY_STATE, SEE_MORE_EVENTS_LABEL } from "features/constants";
import { Community } from "pb/communities_pb";
import React from "react";
import { Link } from "react-router-dom";
import { routeToCommunityEvents } from "routes";

import { useCommunityPageStyles } from "./CommunityPage";
import EventCard from "./EventCard";
import SectionTitle from "./SectionTitle";

export default function PlacesSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useCommunityPageStyles();

  return (
    <>
      <SectionTitle icon={<CalendarIcon />}>Events</SectionTitle>
      {
        //{eventsError && <Alert severity="error">{eventsError.message}</Alert>}
        //{isEventsLoading && <CircularProgress />}
      }
      <HorizontalScroller className={classes.cardContainer}>
        {[0, 1, 2, 3].length === 0 ? (
          <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
        ) : (
          [0, 1, 2, 3, 4, 5, 6].map((i) => (
            <EventCard
              key={`eventcard-${i}`}
              event={{
                creatorName: "Bot",
                location: "Amsterdam",
                startTime: { nanos: 0, seconds: Date.now() / 1000 },
                title: "Placeholder event",
              }}
              className={classes.placeEventCard}
            />
          ))
        )}
        {true && ( //eventsHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Link
              to={routeToCommunityEvents(community.communityId, community.slug)}
            >
              <IconButton aria-label={SEE_MORE_EVENTS_LABEL}>
                <MoreIcon />
              </IconButton>
            </Link>
          </div>
        )}
      </HorizontalScroller>
    </>
  );
}
