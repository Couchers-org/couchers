import { Collapse, styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import Snackbar from "components/Snackbar";
import { createForegroundTracker } from "features/analytics/foregroundTracker";
import { useLogEvent } from "features/analytics/hooks";
import { readSearchReferrer, referrerToProperties } from "features/analytics/searchAttribution";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import NewHostRequest from "features/profile/view/NewHostRequest";
import NewMessage from "features/profile/view/NewMessage";
import Overview from "features/profile/view/Overview";
import useProfileByUsername from "features/userQueries/useProfileByUsername";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { routeToUser, UserTab } from "routes";

import UserCard from "./UserCard";

const REQUEST_ID = "request";

/**
 * Logs `profile.tab_viewed` when the viewed tab changes or the page unmounts,
 * reporting how long the tab was open (`total_ms`) and visible (`foreground_ms`),
 * plus any search referrer that led the user here.
 */
function useProfileTabViewTracking(userId: number | undefined, tab: UserTab) {
  const logEvent = useLogEvent();
  const referrerProps = useMemo(() => referrerToProperties(userId ? readSearchReferrer(userId) : null), [userId]);

  useEffect(() => {
    if (!userId) return;
    const tracker = createForegroundTracker();
    document.addEventListener("visibilitychange", tracker.onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", tracker.onVisibilityChange);
      const { foregroundMs, totalMs } = tracker.finalize();
      logEvent("profile.tab_viewed", {
        user_id: userId,
        tab,
        foreground_ms: foregroundMs,
        total_ms: totalMs,
        ...referrerProps,
      });
    };
  }, [tab, userId, logEvent, referrerProps]);
}

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

export default function UserPage({ username, tab = "about" }: { username: string; tab?: UserTab }) {
  const { t } = useTranslation([PROFILE, GLOBAL]);
  const router = useRouter();

  const { data: user, isLoading, error } = useUserByUsername(username, true);
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useProfileByUsername(username, true);

  const [isRequesting, setIsRequesting] = useState(false);
  const [isSuccessRequest, setIsSuccessRequest] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  useLayoutEffect(() => {
    if (isRequesting || isMessaging) {
      const requestEl = document.getElementById(REQUEST_ID);
      requestEl?.scrollIntoView();
    }
  }, [isRequesting, isMessaging]);

  useProfileTabViewTracking(user?.userId, tab);

  return (
    <>
      <HtmlMeta title={user?.name} />
      {isSuccessRequest && <Snackbar severity="success">{t("request_form.success")}</Snackbar>}
      {error && <Alert severity="error">{error}</Alert>}
      {profileError && <Alert severity="error">{profileError}</Alert>}
      {isLoading || isProfileLoading ? (
        <CenteredSpinner />
      ) : user && profile ? (
        <ProfileUserProvider user={user} profile={profile}>
          <StyledProfileRoot>
            <Overview setIsRequesting={setIsRequesting} setIsMessaging={setIsMessaging} tab={tab} />
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
                    <NewHostRequest setIsRequesting={setIsRequesting} setIsRequestSuccess={setIsSuccessRequest} />
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
