import { styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import EventCard from "features/communities/events/EventCard";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { routeToNewEvent } from "routes";
import { theme } from "theme";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

import Button from "../../components/Button";
import { ListMyEventsRes } from "../../proto/events_pb";
import { service } from "../../service";
import hasAtLeastOnePage from "../../utils/hasAtLeastOnePage";
import { myEventsKey } from "../queryKeys";

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
  borderRadius: "var(--mui-shape-borderRadius) * 2",
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
  const { t } = useTranslation([DASHBOARD]);

  // TODO #5227 - decide on consistent usage of breakpoints
  const isMobile = useIsScreenSizeOrSmaller("smallMobile");

  const { data, error, fetchNextPage, hasNextPage, isFetching, isLoading } =
    useInfiniteQuery<ListMyEventsRes.AsObject, RpcError>({
      queryKey: myEventsKey("upcoming"),
      queryFn: ({ pageParam }) =>
        service.events.listMyEvents({
          pageToken: pageParam as string | undefined,
          pageSize: PAGE_SIZE,
          myCommunities: true,
          myCommunitiesExcludeGlobal: true,
        }),
      getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
      initialPageParam: undefined,
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
            fetchNext={isMobile ? fetchNextPage : undefined}
            hasMore={hasNextPage}
            isFetching={isFetching}
          >
            {data.pages
              .flatMap((page) => page.eventsList)
              .map((event) => {
                return (
                  <StyledCard
                    key={event.eventId}
                    event={event}
                    attendeesCountFormatter={(count) =>
                      t("dashboard:attendees_count", { count })
                    }
                  />
                );
              })}
          </StyledCardContainer>
          {hasNextPage && !isMobile && (
            <StyledButtonContainer>
              <Button onClick={() => fetchNextPage()}>
                {t("dashboard:load_more")}
              </Button>
            </StyledButtonContainer>
          )}
        </>
      ) : (
        !error && (
          <TextBody>
            <Trans
              t={t}
              i18nKey="dashboard:events_empty_state"
              components={[
                <StyledLink key="create-link" href={routeToNewEvent()} />,
              ]}
            />
          </TextBody>
        )
      )}
    </StyledWrapper>
  );
}
