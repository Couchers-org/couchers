import Button from "components/Button";
import HorizontalScroller from "components/HorizontalScroller";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import {
  EVENTS_EMPTY_STATE,
  EVENTS_TITLE,
  SEE_MORE_EVENTS_LABEL,
} from "features/communities/constants";
import { Community } from "pb/communities_pb";
import { useHistory } from "react-router-dom";
import { routeToCommunity } from "routes";

import { useCommunityPageStyles } from "./CommunityPage";
import EventCard from "./EventCard";
import SectionTitle from "./SectionTitle";

export default function PlacesSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useCommunityPageStyles();
  const history = useHistory();

  return (
    <>
      <SectionTitle icon={<CalendarIcon />}>{EVENTS_TITLE}</SectionTitle>
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
                title: "An event",
                creatorName: "Bot",
                location:
                  "Restaurant name, No 2, Something street, Suburb, Amsterdam",
                startTime: { seconds: Date.now() / 1000, nanos: 0 },
              }}
              className={classes.placeEventCard}
            />
          ))
        )}
        {true && ( //eventsHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Button
              onClick={() =>
                history.push(
                  routeToCommunity(
                    community.communityId,
                    community.slug,
                    "events"
                  )
                )
              }
            >
              {SEE_MORE_EVENTS_LABEL}
            </Button>
          </div>
        )}
      </HorizontalScroller>
    </>
  );
}
