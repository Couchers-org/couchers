import { Typography } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { AddIcon, CouchIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";

import { SectionTitle } from "../CommunityPage";
import { useListPublicTrips } from "./useListPublicTrips";

export default function PublicTripsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);
  const { data, error, isLoading } = useListPublicTrips(community.communityId);

  return (
    <>
      <SectionTitle icon={<CouchIcon />}>
        {t("communities:public_trips_label")}
      </SectionTitle>
      <Button sx={{ my: 2 }} startIcon={<AddIcon />}>
        {t("communities:create_public_trip")}
      </Button>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t("communities:public_trips_description")}
      </Typography>
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : data?.publicTripsList.length === 0 ? (
        <Typography variant="body1">
          {t("communities:public_trips_empty_state")}
        </Typography>
      ) : null}
    </>
  );
}
