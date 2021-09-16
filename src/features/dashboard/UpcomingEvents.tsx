import { CircularProgress, Typography } from "@material-ui/core";
import * as Sentry from "@sentry/react";
import classNames from "classnames";
import Alert from "components/Alert";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import { useCommunityPageStyles } from "features/communities/CommunityPage";
import { EVENTS_EMPTY_STATE } from "features/communities/constants";
import EventCard from "features/communities/events/EventCard";
import useUserCommunities from "features/userQueries/useUserCommunities";
import { Error as GrpcError } from "grpc-web";
import { ListEventsRes } from "proto/groups_pb";
import { upcomingEventsKey } from "queryKeys";
import { useQueries } from "react-query";
import { service } from "service";
import { timestamp2Date } from "utils/date";
import makeStyles from "utils/makeStyles";

import { UPCOMING_EVENTS, UPCOMING_EVENTS_LOAD_ERROR } from "./constants";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(2, 0),
  },
  upcomingEventContainer: {
    paddingLeft: 0,
  },
  upcomingEventCard: {
    [theme.breakpoints.up("sm")]: {
      width: "33%",
    },
  },
}));

export default function UpcomingEvents() {
  const classes = { ...useCommunityPageStyles(), ...useStyles() };

  const userCommunitiesQuery = useUserCommunities();
  const userCommunities =
    userCommunitiesQuery.data?.pages.flatMap((page) => page.communitiesList) ||
    [];

  const upcomingEventsQueries = useQueries<ListEventsRes.AsObject, GrpcError>(
    userCommunities.map((community) => ({
      queryKey: upcomingEventsKey(community.communityId),
      queryFn: () => service.events.listCommunityEvents(community.communityId),
    }))
  );
  const areUpcomingEventsLoading = upcomingEventsQueries.some(
    (q) => q.isLoading
  );
  const upcomingEventsError = upcomingEventsQueries.some((q) => {
    if (q.error) {
      Sentry.captureException(q.error, {
        tags: {
          featureArea: "dashboard/upcomingEvents",
        },
      });
      return true;
    }
    return false;
  })
    ? UPCOMING_EVENTS_LOAD_ERROR
    : null;
  const upcomingEvents = upcomingEventsQueries
    .flatMap((q) => q.data?.eventsList || [])
    .sort(
      (first, second) =>
        timestamp2Date(first.startTime!).valueOf() -
        timestamp2Date(second.startTime!).valueOf()
    );

  return (
    <div className={classes.root}>
      <Typography variant="h2">{UPCOMING_EVENTS}</Typography>
      {upcomingEventsError && (
        <Alert severity="error">{upcomingEventsError}</Alert>
      )}
      {areUpcomingEventsLoading ? (
        <CircularProgress />
      ) : upcomingEvents.length > 0 ? (
        <HorizontalScroller
          breakpoint="xl"
          className={classNames(
            classes.cardContainer,
            classes.upcomingEventContainer
          )}
        >
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              className={classNames(
                classes.placeEventCard,
                classes.upcomingEventCard
              )}
            />
          ))}
        </HorizontalScroller>
      ) : (
        !upcomingEventsError && <TextBody>{EVENTS_EMPTY_STATE}</TextBody>
      )}
    </div>
  );
}
