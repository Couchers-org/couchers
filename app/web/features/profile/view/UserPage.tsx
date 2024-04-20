import { CircularProgress, Collapse } from "@material-ui/core";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import Snackbar from "components/Snackbar";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import NewHostRequest from "features/profile/view/NewHostRequest";
import Overview from "features/profile/view/Overview";
import { useProfileStyles } from "features/profile/view/ProfilePage";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useLayoutEffect, useState } from "react";
import { routeToUser, UserTab } from "routes";

import UserCard from "./UserCard";

const REQUEST_ID = "request";

export default function UserPage({
  username,
  tab = "about",
}: {
  username: string;
  tab?: UserTab;
}) {
  const { t } = useTranslation(PROFILE);
  const classes = useProfileStyles();
  const router = useRouter();

  const { data: user, isLoading, error } = useUserByUsername(username, true);

  const [isRequesting, setIsRequesting] = useState(false);
  const [isSuccessRequest, setIsSuccessRequest] = useState(false);

  useLayoutEffect(() => {
    if (isRequesting) {
      const requestEl = document.getElementById(REQUEST_ID);
      requestEl?.scrollIntoView();
    }
  }, [isRequesting]);

  return (
    <>
      <HtmlMeta title={user?.name} />
      {isSuccessRequest && (
        <Snackbar severity="success">{t("request_form.success")}</Snackbar>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <div className={classes.root}>
            <Overview setIsRequesting={setIsRequesting} tab={tab} />
            <UserCard
              tab={tab}
              onTabChange={(newTab) => {
                router.push(routeToUser(user.username, newTab));
              }}
              top={
                <Collapse in={isRequesting}>
                  <NewHostRequest
                    setIsRequesting={setIsRequesting}
                    setIsRequestSuccess={setIsSuccessRequest}
                  />
                </Collapse>
              }
            />
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
