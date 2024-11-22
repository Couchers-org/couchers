import { CircularProgress } from "@mui/material";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import Overview from "features/profile/view/Overview";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { routeToProfile, UserTab } from "routes";
import makeStyles from "utils/makeStyles";

import UserCard from "./UserCard";

export const useProfileStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    [theme.breakpoints.up("sm")]: {
      display: "grid",
      gridTemplateColumns: "2fr 3fr",
      gap: theme.spacing(3),
      margin: theme.spacing(0, 3),
      padding: 0,
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(3),
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "2fr 4fr",
      maxWidth: "61.5rem",
      margin: "0 auto",
    },
  },
}));

export default function ProfilePage({ tab = "about" }: { tab?: UserTab }) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const classes = useProfileStyles();
  const router = useRouter();

  const { data: user, error, isLoading } = useCurrentUser();

  return (
    <>
      <HtmlMeta title={t("global:nav.profile")} />
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <div className={classes.root}>
            <Overview
              setIsRequesting={() => {
                /* TODO: not needed here*/
              }}
              tab={tab}
            />
            <UserCard
              tab={tab}
              onTabChange={(newTab) => {
                router.push(routeToProfile(newTab));
              }}
            />
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
