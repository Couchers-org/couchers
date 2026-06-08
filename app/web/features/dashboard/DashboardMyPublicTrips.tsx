import { ArrowBack, ArrowForward, TravelExplore } from "@mui/icons-material";
import { Box, IconButton, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import FadingScrollTrack from "components/FadingScrollTrack";
import { useAuthContext } from "features/auth/AuthProvider";
import { useListPublicTripsByUser } from "features/publicTrips/useListPublicTrips";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { PublicTripStatus } from "proto/public_trips_pb";
import { useEffect, useRef, useState } from "react";
import { myPublicTripsRoute } from "routes";
import dayjs from "utils/dayjs";

import {
  DashboardPublicTripCard,
  DashboardPublicTripCardSkeleton,
} from "./DashboardPublicTripCard";

export const CARD_WIDTH = 220;
export const CARD_GAP = 12;

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "10px",
  minHeight: "28px",
});

const EmptyStateRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: "16px 18px",
  border: "1px dashed var(--mui-palette-grey-300)",
  borderRadius: "10px",
  background: "var(--mui-palette-grey-50)",
}));

export default function DashboardMyPublicTrips() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([DASHBOARD]);
  const { authState } = useAuthContext();
  const userId = authState.userId ?? 0;

  const { data, isLoading, error } = useListPublicTripsByUser({
    userId,
    pageToken: "",
    ascending: true,
  });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(
      Math.round(el.scrollLeft) < el.scrollWidth - el.clientWidth,
    );
  };

  const activeTrips = (data?.publicTripsList ?? []).filter(
    (trip) =>
      trip.status === PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST &&
      !dayjs(trip.toDate).isBefore(dayjs().startOf("day")),
  );

  useEffect(() => {
    updateScrollState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrips.length, isLoading]);

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
          <TravelExplore
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
          {t("dashboard:public_trips.my_trips_header")}
          {!isLoading && activeTrips.length > 0 && (
            <Box
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--mui-palette-text-secondary)",
                background: "var(--mui-palette-grey-50)",
                borderRadius: 999,
                px: 1.125,
                lineHeight: "20px",
                display: "inline-block",
              }}
            >
              {activeTrips.length}
            </Box>
          )}
        </Typography>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link href={myPublicTripsRoute} style={{ textDecoration: "none" }}>
            <Typography
              component="span"
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "var(--mui-palette-primary-main)",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {t("dashboard:public_trips.manage_link")}
            </Typography>
          </Link>
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

      {error && <Alert severity="error">{error.message}</Alert>}

      {isLoading ? (
        <FadingScrollTrack $gap={CARD_GAP} $snapType="x proximity">
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start" }}
            >
              <DashboardPublicTripCardSkeleton />
            </Box>
          ))}
        </FadingScrollTrack>
      ) : activeTrips.length > 0 ? (
        <FadingScrollTrack
          ref={scrollerRef}
          onScroll={updateScrollState}
          $gap={CARD_GAP}
          $snapType="x proximity"
          $canScrollLeft={canScrollLeft}
          $canScrollRight={canScrollRight}
        >
          {activeTrips.map((trip) => (
            <Box
              key={trip.tripId}
              sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start" }}
            >
              <DashboardPublicTripCard
                trip={trip}
                locale={locale}
                offersCount={trip.offersCount}
              />
            </Box>
          ))}
        </FadingScrollTrack>
      ) : (
        !error && (
          <EmptyStateRow>
            <TravelExplore
              sx={{
                fontSize: 26,
                color: "var(--mui-palette-grey-400)",
                flexShrink: 0,
              }}
            />
            <Typography
              variant="body2"
              sx={{ flex: 1, color: "var(--mui-palette-text-secondary)" }}
            >
              {t("dashboard:public_trips.empty_description")}
            </Typography>
          </EmptyStateRow>
        )
      )}
    </section>
  );
}
