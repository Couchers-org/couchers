import { TravelExplore } from "@mui/icons-material";
import { Box, styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import FadingScrollTrack, { cardScrollDistance } from "components/FadingScrollTrack";
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
  CARD_GAP,
  CARD_WIDTH,
  DashboardPublicTripCard,
  DashboardPublicTripCardSkeleton,
} from "./DashboardPublicTripCard";
import DashboardSectionHeader from "./DashboardSectionHeader";

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
    setCanScrollRight(Math.round(el.scrollLeft) < el.scrollWidth - el.clientWidth);
  };

  const activeTrips = (data?.publicTripsList ?? []).filter(
    (trip) =>
      trip.status === PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST &&
      !dayjs(trip.toDate).isBefore(dayjs().startOf("day")),
  );

  useEffect(() => {
    updateScrollState();
  }, [activeTrips.length, isLoading]);

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * cardScrollDistance(el, CARD_WIDTH, CARD_GAP), behavior: "smooth" });
  };

  return (
    <section>
      <DashboardSectionHeader
        icon={TravelExplore}
        title={t("dashboard:public_trips.my_trips_header")}
        count={isLoading ? 0 : activeTrips.length}
        action={
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
        }
        hasPrevious={canScrollLeft}
        hasNext={canScrollRight}
        onPrevious={() => scroll(-1)}
        onNext={() => scroll(1)}
      />

      {error && <Alert severity="error">{error.message}</Alert>}

      {isLoading ? (
        <FadingScrollTrack $gap={CARD_GAP} $snapType="x proximity">
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start" }}>
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
            <Box key={trip.tripId} sx={{ flex: `0 0 ${CARD_WIDTH}px`, scrollSnapAlign: "start" }}>
              <DashboardPublicTripCard trip={trip} locale={locale} offersCount={trip.offersCount} />
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
            <Typography variant="body2" sx={{ flex: 1, color: "var(--mui-palette-text-secondary)" }}>
              {t("dashboard:public_trips.empty_description")}
            </Typography>
          </EmptyStateRow>
        )
      )}
    </section>
  );
}
