import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { AddIcon, CouchIcon, EditIcon } from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import { Community } from "couchers/proto/communities_pb";
import { useAuthContext } from "features/auth/AuthProvider";
import useAccountInfo from "features/auth/useAccountInfo";
import { SectionTitle } from "features/communities/CommunityPage";
import { useTranslation } from "i18n";
import { DASHBOARD, PUBLIC_TRIPS } from "i18n/namespaces";
import Link from "next/link";
import { useState } from "react";
import { myPublicTripsRoute } from "routes";

import PublicTripCard from "./PublicTripCard";
import PublicTripDialog from "./PublicTripDialog";
import { useListPublicTrips } from "./useListPublicTrips";

const TripsList = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const PaginationRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: theme.spacing(2),
}));

export default function PublicTripsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([PUBLIC_TRIPS, DASHBOARD]);
  // Stack of page tokens visited so far. First entry is "" (the initial page).
  const [tokens, setTokens] = useState<string[]>([""]);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: accountInfo } = useAccountInfo();
  const { authState } = useAuthContext();

  const pageIndex = tokens.length - 1;
  const currentToken = tokens[pageIndex];
  const { data, error, isLoading } = useListPublicTrips(
    community.communityId,
    currentToken,
  );

  // TODO: Replace with real ListPublicTripsByUser query once we wire it up for
  // the user's dashboard; for now we infer "has own trip" from the page we're on.
  const hasOwnTrip = data?.publicTripsList.some(
    (trip) => trip.user?.userId === authState.userId,
  );

  const handleCreateClick = () => {
    if (!accountInfo?.profileComplete) {
      setShowIncompleteDialog(true);
    } else {
      setShowCreateDialog(true);
    }
  };

  const goNext = () => {
    if (data?.nextPageToken) {
      setTokens([...tokens, data.nextPageToken]);
    }
  };

  const goPrev = () => {
    if (pageIndex > 0) {
      setTokens(tokens.slice(0, -1));
    }
  };

  const trips = data?.publicTripsList ?? [];
  const hasResults = trips.length > 0;

  return (
    <>
      {showIncompleteDialog && (
        <ProfileIncompleteDialog
          open
          onClose={() => setShowIncompleteDialog(false)}
          attempted_action="create_public_trip"
        />
      )}
      <PublicTripDialog
        mode="create"
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        communityId={community.communityId}
        communityName={community.name}
      />
      <SectionTitle icon={<CouchIcon />}>{t("publicTrips:label")}</SectionTitle>
      {hasOwnTrip ? (
        <Button
          sx={{ my: 2 }}
          startIcon={<EditIcon />}
          component={Link}
          href={myPublicTripsRoute}
        >
          {t("publicTrips:edit_my_trips")}
        </Button>
      ) : (
        <Button
          sx={{ my: 2 }}
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          {t("publicTrips:create_trip")}
        </Button>
      )}
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t("publicTrips:section_intro")}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : !hasResults && pageIndex === 0 ? (
        <Typography variant="body1">{t("publicTrips:empty_state")}</Typography>
      ) : (
        <>
          <TripsList>
            {trips.map((trip) => (
              <PublicTripCard
                key={trip.tripId}
                id={`trip-${trip.tripId}`}
                trip={trip}
                ownerView={trip.user?.userId === authState.userId}
              />
            ))}
          </TripsList>
          <PaginationRow>
            <Button
              onClick={goPrev}
              disabled={pageIndex === 0}
              startIcon={<ChevronLeftIcon />}
            >
              {t("publicTrips:previous")}
            </Button>
            <Typography variant="body2">
              {t("publicTrips:page_indicator", {
                current: pageIndex + 1,
              })}
            </Typography>
            <Button
              onClick={goNext}
              disabled={!data?.nextPageToken}
              endIcon={<ChevronRightIcon />}
            >
              {t("publicTrips:next")}
            </Button>
          </PaginationRow>
        </>
      )}
    </>
  );
}
