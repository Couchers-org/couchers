import { TravelExplore } from "@mui/icons-material";
import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import CardTrack, { useCardTrack } from "components/CardTrack";
import { useListMyCommunitiesPublicTrips } from "features/publicTrips/useListPublicTrips";
import { useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";

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

export default function DashboardCommunityPublicTrips() {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([DASHBOARD]);

  const { data, isLoading, error } = useListMyCommunitiesPublicTrips("");
  const trips = data?.publicTripsList ?? [];

  const track = useCardTrack();

  return (
    <section>
      <DashboardSectionHeader
        icon={TravelExplore}
        title={t("dashboard:public_trips.community_trips_header")}
        {...track.navProps}
      />

      {error && <Alert severity="error">{error.message}</Alert>}

      {isLoading ? (
        <CardTrack cardWidth={CARD_WIDTH}>
          {[0, 1, 2].map((i) => (
            <DashboardPublicTripCardSkeleton key={i} showCommunityName />
          ))}
        </CardTrack>
      ) : trips.length > 0 ? (
        <CardTrack track={track} cardWidth={CARD_WIDTH}>
          {trips.map((trip) => (
            <DashboardPublicTripCard
              key={trip.tripId}
              trip={trip}
              locale={locale}
              isOwnTrip={false}
              showCommunityName
            />
          ))}
        </CardTrack>
      ) : (
        !error && (
          <EmptyStateRow>
            <TravelExplore sx={{ fontSize: 26, color: "var(--mui-palette-grey-400)", flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1, color: "var(--mui-palette-text-secondary)" }}>
              {t("dashboard:public_trips.community_trips_empty_description")}
            </Typography>
          </EmptyStateRow>
        )
      )}
    </section>
  );
}
