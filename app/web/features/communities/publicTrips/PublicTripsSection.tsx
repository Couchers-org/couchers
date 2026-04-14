import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { styled, Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { AddIcon, CouchIcon, PenIcon } from "components/Icons";
import ProfileIncompleteDialog from "components/ProfileIncompleteDialog/ProfileIncompleteDialog";
import { useAuthContext } from "features/auth/AuthProvider";
import useAccountInfo from "features/auth/useAccountInfo";
import { useTranslation } from "i18n";
import { COMMUNITIES, DASHBOARD } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import { useState } from "react";

import { SectionTitle } from "../CommunityPage";
import PublicTripCard from "./PublicTripCard";
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
  const { t } = useTranslation([COMMUNITIES, DASHBOARD]);
  const [page, setPage] = useState(0);
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const { data: accountInfo } = useAccountInfo();
  const { authState } = useAuthContext();
  const { data, error, isLoading } = useListPublicTrips(
    community.communityId,
    page,
  );

  // TODO: Replace with real ListMyPublicTrips query once backend is ready
  const hasOwnTrip = data?.publicTripsList.some(
    (trip) => trip.user.userId === authState.userId,
  );

  const handleCreateClick = () => {
    if (!accountInfo?.profileComplete) {
      setShowIncompleteDialog(true);
    } else {
      // TODO: navigate to create public trip form
    }
  };

  return (
    <>
      {showIncompleteDialog && (
        <ProfileIncompleteDialog
          open
          onClose={() => setShowIncompleteDialog(false)}
          attempted_action="create_public_trip"
        />
      )}
      <SectionTitle icon={<CouchIcon />}>
        {t("communities:public_trips_label")}
      </SectionTitle>
      {hasOwnTrip ? (
        <Button
          sx={{ my: 2 }}
          startIcon={<PenIcon />}
          onClick={() => {
            // TODO: navigate to edit my public trips page
          }}
        >
          {t("communities:edit_my_public_trips")}
        </Button>
      ) : (
        <Button
          sx={{ my: 2 }}
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          {t("communities:create_public_trip")}
        </Button>
      )}
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t("communities:public_trips_description")}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : data?.publicTripsList.length === 0 && page === 0 ? (
        <Typography variant="body1">
          {t("communities:public_trips_empty_state")}
        </Typography>
      ) : (
        <>
          <TripsList>
            {data?.publicTripsList.map((trip) => (
              <PublicTripCard key={trip.tripId} trip={trip} />
            ))}
          </TripsList>
          <PaginationRow>
            <Button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              startIcon={<ChevronLeftIcon />}
            >
              {t("communities:public_trips_previous")}
            </Button>
            <Typography variant="body2">
              {t("communities:public_trips_page_indicator", {
                current: page + 1,
                total: data?.totalPages ?? 1,
              })}
            </Typography>
            <Button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.nextPageToken}
              endIcon={<ChevronRightIcon />}
            >
              {t("communities:public_trips_next")}
            </Button>
          </PaginationRow>
        </>
      )}
    </>
  );
}
