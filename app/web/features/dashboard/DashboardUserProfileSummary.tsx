import { Alert, CircularProgress, Theme, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import UserOverview from "features/profile/view/UserOverview";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { routeToEditProfile, routeToProfile } from "routes";
import { theme } from "theme";
import makeStyles from "utils/makeStyles";

import MinimalUserProfileCard from "./MinimalUserProfileCard";

function DashboardUserProfileSummaryActions() {
  const { t } = useTranslation([DASHBOARD]);
  return (
    <>
      <Link href={routeToEditProfile()} passHref>
        <Button component="a" color="primary">
          {t("dashboard:profile_summary_edit")}
        </Button>
      </Link>
      <Link href={routeToProfile()} passHref>
        <Button
          component="a"
          variant="outlined"
          sx={{
            color: theme.palette.common.black,
            borderColor: theme.palette.grey[300],

            "&:hover": {
              borderColor: theme.palette.grey[300],
              backgroundColor: "#3135390A",
            },
          }}
        >
          {t("dashboard:profile_summary_view")}
        </Button>
      </Link>
    </>
  );
}

const useStyles = makeStyles({
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
  },
});

export default function DashboardUserProfileSummary() {
  const { data: user, error, isLoading } = useCurrentUser();
  const desktopMode = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("sm")
  );
  const classes = useStyles();
  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <div className={classes.loaderContainer}>
          <CircularProgress />
        </div>
      ) : user ? (
        desktopMode ? (
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
}
