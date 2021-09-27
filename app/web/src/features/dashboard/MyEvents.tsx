import { CircularProgress, Typography } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import HorizontalScroller from "components/HorizontalScroller";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useCommunityPageStyles } from "features/communities/CommunityPage";
import { EVENTS_EMPTY_STATE } from "features/communities/constants";
import EventCard from "features/communities/events/EventCard";
import { Error as GrpcError } from "grpc-web";
import { ListMyEventsRes } from "proto/events_pb";
import { myEventsKey } from "queryKeys";
import { useInfiniteQuery } from "react-query";
import { eventsRoute } from "routes";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { MY_EVENTS, SHOW_ALL_UPCOMING_EVENTS } from "./constants";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "grid",
    rowGap: theme.spacing(2),
    margin: theme.spacing(2, 0, 3),
  },
  upcomingEventContainer: {
    paddingLeft: 0,
  },
  allUpcomingEventsLink: {
    justifySelf: "center",
  },
}));

export default function MyEvents() {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };

  const { data, error, isLoading, hasNextPage } = useInfiniteQuery<
    ListMyEventsRes.AsObject,
    GrpcError
  >({
    queryKey: myEventsKey,
    queryFn: ({ pageParam }) =>
      service.events.listMyEvents({ pageToken: pageParam, pageSize: 3 }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
  });

  return (
    <div className={classes.root}>
      <Typography variant="h2">{MY_EVENTS}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <HorizontalScroller
            className={classNames(
              classes.cardContainer,
              classes.upcomingEventContainer
            )}
          >
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
            <StyledLink
              className={classes.allUpcomingEventsLink}
              to={eventsRoute}
            >
              {SHOW_ALL_UPCOMING_EVENTS}
            </StyledLink>
          )}
        </>
      ) : (
        !error && <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
      )}
    </div>
  );
}
