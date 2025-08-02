import { styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import TextBody from "components/TextBody";
import EventCard from "features/communities/events/EventCard";
import { myEventsKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { COMMUNITIES, DASHBOARD } from "i18n/namespaces";
import { ListMyEventsRes } from "proto/events_pb";
import { useInfiniteQuery } from "react-query";
import { service } from "service";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

const StyledCardContainer = styled(HorizontalScroller)(() => ({
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    left: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    position: "relative",
    right: "50%",
    width: "100vw",
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(3),
  },
  [theme.breakpoints.up("sm")]: {
    display: "grid",
    gap: theme.spacing(3),
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

const StyledCard = styled(EventCard)(() => ({
  width: "90%",
  [theme.breakpoints.down("md")]: {
    width: "100%",
  },
  [theme.breakpoints.up("sm")]: {
    width: "100%",
  },
  [theme.breakpoints.down("sm")]: {
    margin: theme.spacing(0, 2, 1, 0),
  },
  flexShrink: 0,
  borderRadius: theme.shape.borderRadius * 2,
  scrollSnapAlign: "start",
}));

const StyledWrapper = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(2),
  margin: theme.spacing(2, 0, 3),
}));

const StyledButtonContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

const PAGE_SIZE = 2;

export default function MyEvents() {
  const { t } = useTranslation([COMMUNITIES, DASHBOARD]);
  // const classes = { ...useStyles() };
  const theme = useTheme();
  const isBelowSm = useMediaQuery(theme.breakpoints.down("sm"));

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
    <StyledWrapper>
      <Typography variant="h2">{t("dashboard:upcoming_events")}</Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <StyledCardContainer
            fetchNext={isBelowSm ? fetchNextPage : undefined}
            hasMore={hasNextPage}
            isFetching={isFetching}
          >
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => {
                return <StyledCard key={event.eventId} event={event} />;
              })}
          </StyledCardContainer>
          {hasNextPage && !isBelowSm && (
            <StyledButtonContainer>
              <Button
                onClick={() => fetchNextPage()}
                variant="outlined"
                sx={{
                  color: theme.palette.common.black,
                  borderColor: theme.palette.grey[300],

                  "&:hover": {
                    borderColor: theme.palette.grey[300],
                    backgroundColor: "#3135390A",
                  },
                }}
              >
                {t("communities:see_more_events_label")}
              </Button>
            </StyledButtonContainer>
          )}
        </>
      ) : (
        !error && <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
    </StyledWrapper>
  );
}
