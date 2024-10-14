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
import { myEventsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, DASHBOARD } from "i18n/namespaces";
import { ListMyEventsRes } from "proto/events_pb";
import { useInfiniteQuery } from "react-query";
import { service } from "service";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "grid",
    justifyItems: "start",
    rowGap: theme.spacing(2),
    margin: theme.spacing(2, 0, 3),
  },
  upcomingEventContainer: {
    [theme.breakpoints.up("sm")]: {
      display: "grid",
      gridGap: theme.spacing(3),
      gridTemplateColumns: "repeat(2, 1fr)",
    },
  },
  eventCard: {
    width: "90%",
    [theme.breakpoints.up("sm")]: {
      width: "auto",
    },
  },
  allUpcomingEventsLink: {
    justifySelf: "center",
  },
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
}));

const PAGE_SIZE = 2;

export default function MyEvents() {
  const { t } = useTranslation([COMMUNITIES, DASHBOARD]);
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const theme = useTheme();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("xs"));

  const { data, error, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useInfiniteQuery<ListMyEventsRes.AsObject, RpcError>({
      queryKey: myEventsKey("upcoming"),
      queryFn: ({ pageParam }) =>
        service.events.listMyEvents({
          pageToken: pageParam,
          pageSize: PAGE_SIZE,
        }),
      getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    });

  return (
    <div className={classes.root}>
      <Typography variant="h2">{t("dashboard:upcoming_events")}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <div className={classes.loaderContainer}>
          <CircularProgress />
        </div>
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
                    className={classNames(
                      classes.placeEventCard,
                      classes.eventCard
                    )}
                  />
                );
              })}
          </HorizontalScroller>
          {hasNextPage && !isBelowSm && (
            <div className={classes.loaderContainer}>
              <Button onClick={() => fetchNextPage()} variant="outlined">
                {t("communities:see_more_events_label")}
              </Button>
            </div>
          )}
        </>
      ) : (
        !error && <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
    </div>
  );
}
