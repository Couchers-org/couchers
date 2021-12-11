import {
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Button from "components/Button";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import { useCommunityPageStyles } from "features/communities/CommunityPage";
import EventCard from "features/communities/events/EventCard";
import { Error as GrpcError } from "grpc-web";
import { ListMyEventsRes } from "proto/events_pb";
import { myEventsKey } from "queryKeys";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery } from "react-query";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { MY_EVENTS } from "./constants";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "grid",
    justifyItems: "start",
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
  const { t } = useTranslation(["communities"]);
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const theme = useTheme();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("xs"));

  const { data, error, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useInfiniteQuery<ListMyEventsRes.AsObject, GrpcError>({
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
            fetchNext={isBelowSm ? fetchNextPage : undefined}
            hasMore={hasNextPage}
            isFetching={isFetching}
          >
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => {
                return (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    className={classes.placeEventCard}
                  />
                );
              })}
          </HorizontalScroller>
          {hasNextPage && !isBelowSm && (
            <Button onClick={() => fetchNextPage()}>
              {t("communities:see_more_events_label")}
            </Button>
          )}
        </>
      ) : (
        !error && <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
    </div>
  );
}
