import { Luggage, MeetingRoom, SvgIconComponent } from "@mui/icons-material";
import { Box, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import FadingScrollTrack, { cardScrollDistance } from "components/FadingScrollTrack";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { HostRequest } from "proto/requests_pb";
import { useEffect, useRef, useState } from "react";
import { routeToEditProfile, searchRoute } from "routes";
import { theme } from "theme";

import DashboardSectionHeader from "./DashboardSectionHeader";
import UpcomingStayCard, { UpcomingStayCardSkeleton } from "./UpcomingStayCard";
import useGetDashboard from "./useGetDashboard";

interface UpcomingStaysWidgetProps {
  icon: SvgIconComponent;
  title: string;
  requests: HostRequest.AsObject[];
  isLoading: boolean;
  emptyMessage: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
}

const CARD_WIDTH = 220;
const CARD_GAP = 12;

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    // scrollLeft: pixels scrolled; clientWidth: visible width; scrollWidth: total content width.
    // scrollLeft is a float on high-DPI screens, so Math.round prevents the right arrow staying lit at the end.
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(Math.round(el.scrollLeft) < el.scrollWidth - el.clientWidth);
  };

  useEffect(() => {
    updateScrollState();
  }, [requests.length, isLoading]);

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * cardScrollDistance(el, CARD_WIDTH, CARD_GAP), behavior: "smooth" });
  };

  return (
    <section>
      <DashboardSectionHeader
        icon={icon}
        title={title}
        count={isLoading ? 0 : requests.length}
        hasPrevious={canScrollLeft}
        hasNext={canScrollRight}
        onPrevious={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      {isLoading ? (
        <FadingScrollTrack $gap={CARD_GAP} $snapType="x proximity">
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start" }}>
              <UpcomingStayCardSkeleton />
            </Box>
          ))}
        </FadingScrollTrack>
      ) : requests.length === 0 ? (
        <EmptyStateRow>
          <Typography variant="body2" sx={{ flex: 1, color: "var(--mui-palette-text-secondary)" }}>
            {emptyMessage}
          </Typography>
          <Link href={emptyCtaHref} style={{ textDecoration: "none", whiteSpace: "nowrap" }}>
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

export default function UpcomingStays() {
  const { t } = useTranslation([DASHBOARD]);
  const {
    data: { upcomingTrips, upcomingGuests } = { upcomingTrips: [], upcomingGuests: [] },
    isLoading,
    error,
  } = useGetDashboard((dashboard) => ({
    upcomingTrips: dashboard.surfing?.hostRequestsList ?? [],
    upcomingGuests: dashboard.hosting?.hostRequestsList ?? [],
  }));

  return (
    <div>
      {error && <Alert severity="error">{error.message}</Alert>}

      <UpcomingStaysWidget
        icon={MeetingRoom}
        title={t("dashboard:stays.upcoming_guests_header")}
        requests={upcomingGuests}
        isLoading={isLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_guests")}
        emptyCtaLabel={t("dashboard:become_a_host")}
        emptyCtaHref={`${routeToEditProfile("about")}#preferences`}
      />

      <Box sx={{ height: theme.spacing(3) }} />

      <UpcomingStaysWidget
        icon={Luggage}
        title={t("dashboard:stays.upcoming_trips_header")}
        requests={upcomingTrips}
        isLoading={isLoading}
        emptyMessage={t("dashboard:stays.no_upcoming_trips")}
        emptyCtaLabel={t("dashboard:find_a_host")}
        emptyCtaHref={searchRoute}
      />
    </div>
  );
}
