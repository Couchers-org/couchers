import { Alert, Theme, useMediaQuery } from "@mui/material";
import { useTranslation } from "next-i18next";
import Link from "next/link";

import Button from "@/components/Button";
import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { ProfileUserProvider } from "@/features/profile/hooks/useProfileUser";
import UserOverview from "@/features/profile/view/UserOverview";
import useCurrentUser from "@/features/userQueries/useCurrentUser";
import { DASHBOARD } from "@/i18n/namespaces";
import { routeToEditProfile, routeToProfile } from "@/routes";
import { theme } from "@/theme";

import MinimalUserProfileCard from "./MinimalUserProfileCard";

const DashboardUserProfileSummaryActions = () => {
  const { t } = useTranslation([DASHBOARD]);
  return (
    <>
      <Button component={Link} color="primary" href={routeToEditProfile()}>
        {t("dashboard:profile_summary_edit")}
      </Button>

      <Button
        component={Link}
        variant="outlined"
        sx={{
          color: theme.palette.common.black,
          borderColor: theme.palette.grey[300],

          "&:hover": {
            borderColor: theme.palette.grey[300],
            backgroundColor: "#3135390A",
          },
        }}
        href={routeToProfile()}
      >
        {t("dashboard:profile_summary_view")}
      </Button>
    </>
  );
};

const DashboardUserProfileSummary = () => {
  const { data: user, error, isLoading } = useCurrentUser();
  const isDesktopMode = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("sm"),
  );
  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : user ? (
        isDesktopMode ? (
          <ProfileUserProvider user={user}>
            <UserOverview
              actions={<DashboardUserProfileSummaryActions />}
              showHostAndMeetAvailability
            />
          </ProfileUserProvider>
        ) : (
          <MinimalUserProfileCard user={user} />
        )
      ) : null}
    </>
  );
};

export default DashboardUserProfileSummary;
