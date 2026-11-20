import { TravelExplore } from "@mui/icons-material";
import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import CardTrack, { useCardTrack } from "components/CardTrack";
import { useAuthContext } from "features/auth/AuthProvider";
import { useListPublicTripsByUser } from "features/publicTrips/useListPublicTrips";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { PublicTripStatus } from "proto/public_trips_pb";
import { myPublicTripsRoute } from "routes";
import dayjs from "utils/dayjs";

import { CARD_WIDTH, DashboardPublicTripCard, DashboardPublicTripCardSkeleton } from "./DashboardPublicTripCard";
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

  const activeTrips = (data?.publicTripsList ?? []).filter(
    (trip) =>
      trip.status === PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST &&
      !dayjs(trip.toDate).isBefore(dayjs().startOf("day")),
  );

  const track = useCardTrack();

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
        {...track.navProps}
      />

      {error && <Alert severity="error">{error.message}</Alert>}

      {isLoading ? (
        <CardTrack cardWidth={CARD_WIDTH}>
          {[0, 1, 2].map((i) => (
            <DashboardPublicTripCardSkeleton key={i} />
          ))}
        </CardTrack>
      ) : activeTrips.length > 0 ? (
        <CardTrack track={track} cardWidth={CARD_WIDTH}>
          {activeTrips.map((trip) => (
            <DashboardPublicTripCard key={trip.tripId} trip={trip} locale={locale} offersCount={trip.offersCount} />
          ))}
        </CardTrack>
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
