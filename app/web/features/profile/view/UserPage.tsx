import { CircularProgress, Collapse, styled } from "@mui/material";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import Snackbar from "components/Snackbar";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import NewHostRequest from "features/profile/view/NewHostRequest";
import Overview from "features/profile/view/Overview";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useTranslation } from "i18n";
import { PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useLayoutEffect, useState } from "react";
import { routeToUser, UserTab } from "routes";

import UserCard from "./UserCard";

const REQUEST_ID = "request";

const StyledProfileRoot = styled("div")(({ theme }) => ({
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
}));

export default function UserPage({
  username,
  tab = "about",
}: {
  username: string;
  tab?: UserTab;
}) {
  const { t } = useTranslation(PROFILE);
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
          <StyledProfileRoot>
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
          </StyledProfileRoot>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
