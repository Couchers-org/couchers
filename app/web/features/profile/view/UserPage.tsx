import { Collapse, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import Snackbar from "components/Snackbar";
import { useLogEvent } from "features/analytics/hooks";
import {
  readSearchReferrer,
  referrerToProperties,
} from "features/analytics/searchAttribution";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import NewHostRequest from "features/profile/view/NewHostRequest";
import NewMessage from "features/profile/view/NewMessage";
import Overview from "features/profile/view/Overview";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { routeToUser, UserTab } from "routes";

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

export default function UserPage({
  username,
  tab = "about",
}: {
  username: string;
  tab?: UserTab;
}) {
  const { t } = useTranslation([PROFILE, GLOBAL]);
  const router = useRouter();

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

  const logEvent = useLogEvent();
  const userId = user?.userId;
  const referrerProps = useMemo(
    () => referrerToProperties(userId ? readSearchReferrer(userId) : null),
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    const startedAt = performance.now();
    let foregroundAccumMs = 0;
    let visibleSince: number | null =
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? startedAt
        : null;

    const onVis = () => {
      const now = performance.now();
      if (document.visibilityState === "visible") {
        if (visibleSince === null) visibleSince = now;
      } else if (visibleSince !== null) {
        foregroundAccumMs += now - visibleSince;
        visibleSince = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      const now = performance.now();
      if (visibleSince !== null) foregroundAccumMs += now - visibleSince;
      const totalMs = now - startedAt;
      logEvent("profile.tab_viewed", {
        user_id: userId,
        tab,
        foreground_ms: Math.round(foregroundAccumMs),
        total_ms: Math.round(totalMs),
        ...referrerProps,
      });
    };
  }, [tab, userId, logEvent, referrerProps]);

  return (
    <>
      <HtmlMeta title={user?.name} />
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
                  <Collapse in={isRequesting} mountOnEnter unmountOnExit>
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
