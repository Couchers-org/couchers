import { Collapse, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HeaderButton from "components/HeaderButton";
import HtmlMeta from "components/HtmlMeta";
import { BackIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import NewHostRequest from "features/profile/view/NewHostRequest";
import NewMessage from "features/profile/view/NewMessage";
import Overview from "features/profile/view/Overview";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useLayoutEffect, useState } from "react";
import { routeToUser, UserTab } from "routes";
import { sendNativeBack, useIsNativeEmbed } from "utils/nativeLink";

import UserCard from "./UserCard";

const REQUEST_ID = "request";

export const StyledProfileRoot = styled("div")(({ theme }) => ({
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

const StyledBackButton = styled(HeaderButton)(() => ({
  position: "fixed",
  top: "calc(var(--nav-height, 56px) + 1rem)",
  left: "2rem",
  zIndex: 10,
}));

export default function UserPage({
  username,
  tab = "about",
}: {
  username: string;
  tab?: UserTab;
}) {
  const { t } = useTranslation([PROFILE, GLOBAL]);
  const router = useRouter();
  const isNativeEmbed = useIsNativeEmbed();

  const { data: user, isLoading, error } = useUserByUsername(username, true);

  const [isRequesting, setIsRequesting] = useState(false);
  const [isSuccessRequest, setIsSuccessRequest] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  useLayoutEffect(() => {
    if (isRequesting || isMessaging) {
      const requestEl = document.getElementById(REQUEST_ID);
      requestEl?.scrollIntoView();
    }
  }, [isRequesting, isMessaging]);

  return (
    <>
      <HtmlMeta title={user?.name} />
      {isNativeEmbed && (
        <StyledBackButton
          onClick={() => sendNativeBack()}
          aria-label={t("global:back")}
        >
          <BackIcon />
        </StyledBackButton>
      )}
      {isSuccessRequest && (
        <Snackbar severity="success">{t("request_form.success")}</Snackbar>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <StyledProfileRoot>
            <Overview
              setIsRequesting={setIsRequesting}
              setIsMessaging={setIsMessaging}
              tab={tab}
            />
            <UserCard
              tab={tab}
              onTabChange={(newTab) => {
                router.push(routeToUser(user.username, newTab), undefined, {
                  scroll: false,
                });
              }}
              top={
                <>
                  <Collapse in={isRequesting}>
                    <NewHostRequest
                      setIsRequesting={setIsRequesting}
                      setIsRequestSuccess={setIsSuccessRequest}
                    />
                  </Collapse>
                  <Collapse in={isMessaging}>
                    <NewMessage setIsMessaging={setIsMessaging} />
                  </Collapse>
                </>
              }
            />
          </StyledProfileRoot>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
