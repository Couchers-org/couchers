import { ArrowBack, ArrowForward } from "@mui/icons-material";
import { Box, IconButton, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import FadingScrollTrack from "components/FadingScrollTrack";
import { CouchIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import { SectionTitle } from "features/communities/CommunityPage";
import { CARD_GAP, CARD_WIDTH, DashboardPublicTripCard } from "features/dashboard/DashboardPublicTripCard";
import { useTranslation } from "i18n";
import { PUBLIC_TRIPS } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useEffect, useRef, useState } from "react";
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

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(Math.round(el.scrollLeft) < el.scrollWidth - el.clientWidth);
  };

  const allTrips = data?.publicTripsList ?? [];
  const trips = allTrips.slice(0, PREVIEW_COUNT);

  useEffect(() => {
    updateScrollState();
  }, [trips.length, isLoading]);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: dir * (CARD_WIDTH + CARD_GAP),
      behavior: "smooth",
    });
  };

  return (
    <StyledSection>
      <SectionHeader>
        <SectionTitle icon={<CouchIcon />} variant="h2">
          {t("publicTrips:label")}
        </SectionTitle>
        {trips.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <IconButton
              size="small"
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              color={canScrollLeft ? "primary" : "default"}
              aria-label={t("publicTrips:prev_page_button_a11y")}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              color={canScrollRight ? "primary" : "default"}
              aria-label={t("publicTrips:next_page_button_a11y")}
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
        <FadingScrollTrack
          ref={scrollerRef}
          onScroll={updateScrollState}
          $gap={CARD_GAP}
          $snapType="x proximity"
          $canScrollLeft={canScrollLeft}
          $canScrollRight={canScrollRight}
        >
          {trips.map((trip) => (
            <div
              key={trip.tripId}
              style={{
                flex: `0 0 ${CARD_WIDTH}px`,
                scrollSnapAlign: "start",
              }}
            >
              <DashboardPublicTripCard trip={trip} locale={locale} isOwnTrip={trip.user?.userId === authState.userId} />
            </div>
          ))}
        </FadingScrollTrack>
      ) : (
        <TextBody>{t("publicTrips:empty_state")}</TextBody>
      )}

      <FooterRow>
        {trips.length > 0 && (
          <StyledLink href={routeToCommunity(community.communityId, community.slug, "public-trips")}>
            {t("publicTrips:see_all")}
          </StyledLink>
        )}
      </FooterRow>
    </StyledSection>
  );
}
