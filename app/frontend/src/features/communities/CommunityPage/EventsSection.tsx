import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HorizontalScroller from "components/HorizontalScroller";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import {
  EVENTS_EMPTY_STATE,
  EVENTS_TITLE,
  SEE_MORE_EVENTS_LABEL,
} from "features/communities/constants";
import { Community } from "proto/communities_pb";
import { useHistory } from "react-router-dom";
import { routeToCommunity } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { useListCommunityEvents } from "../hooks";
import { useCommunityPageStyles } from "./CommunityPage";
import EventCard from "./EventCard";
import SectionTitle from "./SectionTitle";

export default function EventsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useCommunityPageStyles();
  const history = useHistory();

  const { data, error, hasNextPage, isLoading } = useListCommunityEvents(
    community.communityId
  );

  return (
    <>
      <SectionTitle icon={<CalendarIcon />} variant="h2">
        {EVENTS_TITLE}
      </SectionTitle>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
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
          {hasNextPage && (
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
      ) : (
        !error && <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
      )}
    </>
  );
}
