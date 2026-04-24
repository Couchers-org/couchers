import { styled } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { CouchIcon, PersonIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { SectionTitle } from "features/communities/CommunityPage";
import { useTranslation } from "i18n";
import { PUBLIC_TRIPS } from "i18n/namespaces";
import Link from "next/link";
import { Community } from "proto/communities_pb";
import { myPublicTripsRoute, routeToCommunity } from "routes";
import { theme } from "theme";

import CompactPublicTripCard from "./CompactPublicTripCard";
import { useListPublicTrips } from "./useListPublicTrips";

const PREVIEW_COUNT = 3;

const StyledSection = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(2),
}));

const CardList = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

const FooterRow = styled("div")(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

const EditButton = styled(Button)(() => ({
  justifySelf: "start",
}));

export default function PublicTripsOverview({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([PUBLIC_TRIPS]);

  const { data, error, isLoading } = useListPublicTrips(
    community.communityId,
    "",
  );

  const allTrips = data?.publicTripsList ?? [];
  const trips = allTrips.slice(0, PREVIEW_COUNT);

  return (
    <StyledSection>
      <SectionTitle icon={<CouchIcon />} variant="h2">
        {t("publicTrips:label")}
      </SectionTitle>

      <EditButton
        component={Link}
        href={myPublicTripsRoute}
        startIcon={<PersonIcon />}
      >
        {t("publicTrips:edit_my_trips")}
      </EditButton>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : trips.length > 0 ? (
        <CardList>
          {trips.map((trip) => (
            <CompactPublicTripCard
              key={trip.tripId}
              trip={trip}
              communityId={community.communityId}
              communitySlug={community.slug}
            />
          ))}
        </CardList>
      ) : (
        <TextBody>{t("publicTrips:empty_state")}</TextBody>
      )}

      <FooterRow>
        {trips.length > 0 && (
          <StyledLink
            href={routeToCommunity(
              community.communityId,
              community.slug,
              "public-trips",
            )}
          >
            {t("publicTrips:see_all")}
          </StyledLink>
        )}
      </FooterRow>
    </StyledSection>
  );
}
