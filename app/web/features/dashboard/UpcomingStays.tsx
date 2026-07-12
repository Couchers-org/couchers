import {
  ArrowBack,
  ArrowForward,
  Luggage,
  MeetingRoom,
} from "@mui/icons-material";
import { Box, IconButton, styled, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import Alert from "components/Alert";
import FadingScrollTrack from "components/FadingScrollTrack";
import { hostRequestsListKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { HostRequestStatus } from "proto/conversations_pb";
import {
  HostRequest,
  HostRequestSortBy,
  ListHostRequestsRes,
} from "proto/requests_pb";
import { useEffect, useRef, useState } from "react";
import { routeToEditProfile, searchRoute } from "routes";
import { service } from "service";
import { theme } from "theme";

import SectionCountBadge from "./SectionCountBadge";
import UpcomingStayCard, { UpcomingStayCardSkeleton } from "./UpcomingStayCard";

interface UpcomingStaysWidgetProps {
  icon: React.ReactNode;
  title: string;
  requests: HostRequest.AsObject[];
  isLoading: boolean;
  emptyMessage: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
}

const CARD_WIDTH = 220;
const CARD_GAP = 12;

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(1.5),
  minHeight: 28,
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

function UpcomingStaysWidget({
  icon,
  title,
  requests,
  isLoading,
  emptyMessage,
  emptyCtaLabel,
  emptyCtaHref,
}: UpcomingStaysWidgetProps) {
  const { t } = useTranslation([DASHBOARD]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    // scrollLeft: pixels scrolled; clientWidth: visible width; scrollWidth: total content width.
    // scrollLeft is a float on high-DPI screens, so Math.round prevents the right arrow staying lit at the end.
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(
      Math.round(el.scrollLeft) < el.scrollWidth - el.clientWidth,
    );
  };

  useEffect(() => {
    updateScrollState();
  }, [requests.length, isLoading]);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: dir * (CARD_WIDTH + CARD_GAP) * 2,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <SectionHeader>
        <Typography
          variant="h2"
          sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
        >
          {icon}
          {title}
          {!isLoading && requests.length > 0 && (
            <SectionCountBadge count={requests.length} />
          )}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            color={canScrollLeft ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            color={canScrollRight ? "primary" : "default"}
            aria-label={t("dashboard:next_page_button_a11y")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>

      {isLoading ? (
        <FadingScrollTrack $gap={CARD_GAP} $snapType="x proximity">
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start" }}
            >
              <UpcomingStayCardSkeleton />
            </Box>
          ))}
        </FadingScrollTrack>
      ) : requests.length === 0 ? (
        <EmptyStateRow>
          <Typography
            variant="body2"
            sx={{ flex: 1, color: "var(--mui-palette-text-secondary)" }}
          >
            {emptyMessage}
          </Typography>
          <Link
            href={emptyCtaHref}
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            <Typography
              component="span"
              variant="body2"
              sx={{
                color: "var(--mui-palette-primary-main)",
                fontWeight: 600,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {emptyCtaLabel} →
            </Typography>
          </Link>
        </EmptyStateRow>
      ) : (
        <FadingScrollTrack
          ref={scrollerRef}
          onScroll={updateScrollState}
          $gap={CARD_GAP}
          $snapType="x proximity"
          $canScrollLeft={canScrollLeft}
          $canScrollRight={canScrollRight}
        >
          {requests.map((r) => (
            <Box
              key={r.hostRequestId}
              sx={{
                flex: `0 0 ${CARD_WIDTH}px`,
                minWidth: 0,
                scrollSnapAlign: "start",
              }}
            >
              <UpcomingStayCard hostRequest={r} />
            </Box>
          ))}
        </FadingScrollTrack>
      )}
    </section>
  );
}

const UPCOMING_STATUSES = [
  HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
  HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED,
];

export default function UpcomingStays() {
  const { t } = useTranslation([DASHBOARD]);

  const {
    data: tripsData,
    isLoading: tripsLoading,
    error: tripsError,
  } = useInfiniteQuery<ListHostRequestsRes.AsObject, RpcError>({
    queryKey: hostRequestsListKey({ type: "surfing", onlyActive: true }),
    queryFn: ({ pageParam }) =>
      service.requests.listHostRequests({
        pageToken: pageParam as string | undefined,
        type: "surfing",
        onlyActive: true,
        statusIn: UPCOMING_STATUSES,
        sortBy: HostRequestSortBy.HOST_REQUEST_SORT_BY_FROM_DATE,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.nextPageToken,
  });

  const {
    data: guestsData,
    isLoading: guestsLoading,
    error: guestsError,
  } = useInfiniteQuery<ListHostRequestsRes.AsObject, RpcError>({
    queryKey: hostRequestsListKey({ type: "hosting", onlyActive: true }),
    queryFn: ({ pageParam }) =>
      service.requests.listHostRequests({
        pageToken: pageParam as string | undefined,
        type: "hosting",
        onlyActive: true,
        statusIn: UPCOMING_STATUSES,
        sortBy: HostRequestSortBy.HOST_REQUEST_SORT_BY_FROM_DATE,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.noMore ? undefined : lastPage.nextPageToken,
  });

  const upcomingTrips = (tripsData?.pages ?? []).flatMap(
    (page) => page.hostRequestsList,
  );
  const upcomingGuests = (guestsData?.pages ?? []).flatMap(
    (page) => page.hostRequestsList,
  );

  const error = tripsError ?? guestsError;

  return (
    <div>
      {error && <Alert severity="error">{error.message}</Alert>}

      <UpcomingStaysWidget
        icon={
          <MeetingRoom
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
        }
        title={t("dashboard:stays.upcoming_guests_header")}
        requests={upcomingGuests}
        isLoading={guestsLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_guests")}
        emptyCtaLabel={t("dashboard:become_a_host")}
        emptyCtaHref={`${routeToEditProfile("about")}#preferences`}
      />

      <Box sx={{ height: theme.spacing(3) }} />

      <UpcomingStaysWidget
        icon={
          <Luggage
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
        }
        title={t("dashboard:stays.upcoming_trips_header")}
        requests={upcomingTrips}
        isLoading={tripsLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_trips")}
        emptyCtaLabel={t("dashboard:find_a_host")}
        emptyCtaHref={searchRoute}
      />
    </div>
  );
}
