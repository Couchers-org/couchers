import { Edit } from "@mui/icons-material";
import { Alert, Theme, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import UserOverview from "features/profile/view/UserOverview";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { routeToEditProfile, routeToProfile } from "routes";

import MinimalUserProfileCard from "./MinimalUserProfileCard";

function DashboardUserProfileSummaryActions() {
  const { t } = useTranslation([DASHBOARD]);
  return (
    <>
      <Button component={Link} color="primary" href={routeToEditProfile()} startIcon={<Edit fontSize="small" />}>
        {t("dashboard:profile_summary_edit")}
      </Button>
      <Button component={Link} variant="outlined" href={routeToProfile()}>
        {t("dashboard:profile_summary_view")}
      </Button>
    </>
  );
}

export default function DashboardUserProfileSummary() {
  const { data: user, error, isLoading } = useCurrentUser();
  const desktopMode = useMediaQuery((theme: Theme) => theme.breakpoints.up("sm"));
  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : user ? (
        desktopMode ? (
          <ProfileUserProvider user={user}>
            <UserOverview actions={<DashboardUserProfileSummaryActions />} showHostAndMeetAvailability />
          </ProfileUserProvider>
        ) : (
          <MinimalUserProfileCard user={user} />
        )
      ) : null}
    </>
  );
}
