import { ArrowBack, ArrowForward, Event } from "@mui/icons-material";
import { IconButton, styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import { ListMyEventsRes } from "couchers/proto/events_pb";
import { RpcError } from "grpc-web";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";
import { routeToNewEvent } from "routes";

import { service } from "../../service";
import { myEventsKey } from "../queryKeys";
import EventListRow, {
  EventListContainer,
  EventListRowSkeleton,
} from "./EventListRow";

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

const EmptyStateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  border: "1px dashed var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-grey-50)",
}));

export default function MyUpcomingEvents() {
  const { t } = useTranslation([DASHBOARD]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListMyEventsRes.AsObject, RpcError>({
    queryKey: myEventsKey("upcoming"),
    queryFn: ({ pageParam: pageToken }) =>
      service.events.listMyEvents({
        pageToken: pageToken as string | undefined,
        pageSize: 3,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.nextPageToken ? lastPage.nextPageToken : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const pages = data?.pages ?? [];
  const isLastLoadedPage =
    pages.length === 0 || currentPageIndex === pages.length - 1;
  const currentItems = pages[currentPageIndex]?.eventsList;

  const hasPrev = currentPageIndex > 0;
  const hasForward = !isLastLoadedPage || !!hasNextPage;

  const handleNext = () => {
    if (!isLastLoadedPage) {
      setCurrentPageIndex((i) => i + 1);
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      setCurrentPageIndex((i) => i + 1);
    }
  };

  const showingSkeleton =
    isLoading || (isFetchingNextPage && currentItems === undefined);

  return (
    <div>
      <SectionHeader>
        <Typography
          variant="h2"
          sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
        >
          <Event
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
          {t("dashboard:events.your_upcoming_header")}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => setCurrentPageIndex((i) => i - 1)}
            disabled={!hasPrev}
            color={hasPrev ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleNext}
            disabled={!hasForward || isFetchingNextPage}
            color={hasForward ? "primary" : "default"}
            aria-label={t("dashboard:next_page_button_a11y")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>
      {error && <Alert severity="error">{error.message}</Alert>}
      {showingSkeleton ? (
        <EventListContainer>
          {[0, 1, 2].map((i) => (
            <EventListRowSkeleton key={i} />
          ))}
        </EventListContainer>
      ) : currentItems?.length ? (
        <EventListContainer>
          {currentItems.map((event) => (
            <EventListRow key={event.eventId} event={event} />
          ))}
        </EventListContainer>
      ) : (
        !error && (
          <EmptyStateRow>
            <Typography
              variant="body2"
              sx={{ color: "var(--mui-palette-text-secondary)" }}
            >
              <Trans
                t={t}
                i18nKey="dashboard:events.your_upcoming_empty_message"
                components={[
                  <StyledLink key="create-link" href={routeToNewEvent()} />,
                ]}
              />
            </Typography>
          </EmptyStateRow>
        )
      )}
    </div>
  );
}
