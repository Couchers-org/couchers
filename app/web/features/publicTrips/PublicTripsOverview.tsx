import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { Box, IconButton, styled } from "@mui/material";
import Alert from "components/Alert";
import CardTrack, { useCardTrack } from "components/CardTrack";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { CouchIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import { SectionTitle } from "features/communities/CommunityPage";
import { CARD_WIDTH, DashboardPublicTripCard } from "features/dashboard/DashboardPublicTripCard";
import { useTranslation } from "i18n";
import { PUBLIC_TRIPS } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { routeToCommunity } from "routes";
import { theme } from "theme";

import { useListPublicTrips } from "./useListPublicTrips";

const PREVIEW_COUNT = 3;

const StyledSection = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(2),
}));

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const FooterRow = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export default function PublicTripsOverview({ community }: { community: Community.AsObject }) {
  const {
    t,
    i18n: { language: locale },
  } = useTranslation([PUBLIC_TRIPS]);
  const { authState } = useAuthContext();

  const { data, error, isLoading } = useListPublicTrips(community.communityId, "");

  const allTrips = data?.publicTripsList ?? [];
  const trips = allTrips.slice(0, PREVIEW_COUNT);

  const track = useCardTrack({ maxCardsPerScroll: 1 });
  const { canScrollLeft, canScrollRight } = track;

  return (
    <StyledSection>
      <SectionHeader>
        <SectionTitle icon={<CouchIcon />} variant="h2">
          {t("publicTrips:heading")}
        </SectionTitle>
        {trips.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <IconButton
              size="small"
              onClick={track.navProps.onPrevious}
              disabled={!canScrollLeft}
              color={canScrollLeft ? "primary" : "default"}
              aria-label={t("publicTrips:trip_list.pagination.previous_button_a11y")}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={track.navProps.onNext}
              disabled={!canScrollRight}
              color={canScrollRight ? "primary" : "default"}
              aria-label={t("publicTrips:trip_list.pagination.next_button_a11y")}
            >
              <ArrowForward fontSize="small" />
            </IconButton>
          </Box>
        )}
      </SectionHeader>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : trips.length > 0 ? (
        <CardTrack track={track} cardWidth={CARD_WIDTH}>
          {trips.map((trip) => (
            <DashboardPublicTripCard
              key={trip.tripId}
              trip={trip}
              locale={locale}
              isOwnTrip={trip.user?.userId === authState.userId}
            />
          ))}
        </CardTrack>
      ) : (
        <TextBody>{t("publicTrips:trip_list.empty_placeholder")}</TextBody>
      )}

      <FooterRow>
        {trips.length > 0 && (
          <StyledLink href={routeToCommunity(community.communityId, community.slug, "public-trips")}>
            {t("publicTrips:trip_list.see_all_link")}
          </StyledLink>
        )}
      </FooterRow>
    </StyledSection>
  );
}
