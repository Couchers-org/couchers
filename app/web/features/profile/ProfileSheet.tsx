import { ArrowBack } from "@mui/icons-material";
import {
  Collapse,
  IconButton,
  Skeleton,
  styled,
  SwipeableDrawer,
} from "@mui/material";
import Snackbar from "components/Snackbar";
import BadgeDetail from "features/badges/BadgeDetail";
import GroupChatView from "features/messages/groupchats/GroupChatView";
import NewHostRequest from "features/profile/view/NewHostRequest";
import NewMessage from "features/profile/view/NewMessage";
import Overview from "features/profile/view/Overview";
import UserCard from "features/profile/view/UserCard";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { UserTab } from "routes";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

import { ProfileUserProvider } from "./hooks/useProfileUser";
import { useProfileSheet } from "./ProfileSheetContext";

const iOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const StyledDrawer = styled(SwipeableDrawer)({
  "& .MuiDrawer-paper": {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "var(--mui-palette-background-paper)",
  },
});

const Puller = styled("div")({
  width: 30,
  height: 6,
  backgroundColor: "var(--mui-palette-grey-300)",
  borderRadius: 3,
  position: "absolute",
  top: 8,
  left: "calc(50% - 15px)",
});

const SheetHeader = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  padding: theme.spacing(1, 1, 0),
  minHeight: theme.spacing(4),
  flexShrink: 0,
  position: "relative",
  backgroundColor: "var(--mui-palette-background-paper)",
}));

const ScrollContent = styled("div")({
  overflowY: "auto",
  flexGrow: 1,
  WebkitOverflowScrolling: "touch",
});

const REQUEST_ID = "request";

function ProfileSheetSkeleton() {
  return (
    <ScrollContent>
      {/* Overview card */}
      <Skeleton
        variant="circular"
        width={120}
        height={120}
        sx={{ mx: "auto", mt: 2 }}
      />
      <Skeleton width="50%" height={32} sx={{ mx: "auto", mt: 1 }} />
      <Skeleton width="35%" height={20} sx={{ mx: "auto" }} />
      <Skeleton width="40%" height={20} sx={{ mx: "auto", mb: 2 }} />
      {/* Tab bar */}
      <Skeleton variant="rectangular" height={40} sx={{ mx: 2, mb: 1 }} />
      {/* Content lines */}
      <Skeleton width="90%" sx={{ mx: "auto", mt: 2 }} />
      <Skeleton width="80%" sx={{ mx: "auto" }} />
      <Skeleton width="85%" sx={{ mx: "auto" }} />
    </ScrollContent>
  );
}

export default function ProfileSheet() {
  const isMobile = useIsScreenSizeOrSmaller("mobile");
  const { t } = useTranslation([GLOBAL, PROFILE, CONNECTIONS]);

  const {
    openProfileUserId,
    closeProfileSheet,
    goBackProfile,
    profileHistory,
    openGroupChatId,
    closeGroupChat,
    selectedBadgeId,
    closeBadge,
  } = useProfileSheet();
  const router = useRouter();
  const { data: user, isLoading } = useUser(openProfileUserId ?? undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<UserTab>("about");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSuccessRequest, setIsSuccessRequest] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  useEffect(() => {
    setTab("about");
    setIsRequesting(false);
    setIsSuccessRequest(false);
    setIsMessaging(false);
  }, [openProfileUserId]);

  useEffect(() => {
    const handleRouteChange = () => {
      // If the sheet pushed a history entry for the back-gesture handler,
      // replace it with a clean state now so the pushState cleanup effect
      // doesn't call history.back() and fight against the incoming navigation.
      if (window.history.state?.profileSheetOpen) {
        window.history.replaceState(null, "");
      }
      closeProfileSheet();
    };
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router.events, closeProfileSheet]);

  // On Android, the hardware back gesture triggers webview.goBack() in the native
  // layer. Push a history entry when the sheet opens (and another for each deeper
  // profile navigation) so goBack() fires popstate here instead of routing away.
  // We track how many entries we pushed so cleanup removes them all at once.
  const isSheetOpen = openProfileUserId !== null;
  const pushedCountRef = useRef(0);
  const prevProfileHistoryLengthRef = useRef(0);

  useEffect(() => {
    if (!isMobile || !isSheetOpen) return;
    window.history.pushState({ profileSheetOpen: true }, "");
    pushedCountRef.current = 1;
    prevProfileHistoryLengthRef.current = 0;
    return () => {
      const count = pushedCountRef.current;
      pushedCountRef.current = 0;
      // The route-change handler replaces the current entry with null before
      // calling closeProfileSheet, so the check fails there and we don't fight
      // the incoming navigation. For explicit closes (tap-outside, programmatic)
      // the state is still ours and we go back the full stack depth.
      if (count > 0 && window.history.state?.profileSheetOpen) {
        window.history.go(-count);
      }
    };
  }, [isSheetOpen, isMobile]);

  // Push an extra history entry each time the user navigates deeper so every
  // back press has a matching popstate to intercept.
  useEffect(() => {
    if (!isMobile || !isSheetOpen) return;
    const currentLength = profileHistory.length;
    if (currentLength > prevProfileHistoryLengthRef.current) {
      window.history.pushState({ profileSheetOpen: true }, "");
      pushedCountRef.current++;
    }
    prevProfileHistoryLengthRef.current = currentLength;
  }, [isMobile, isSheetOpen, profileHistory.length]);

  // Keep a ref so the popstate handler always has the latest back/close logic
  // without re-registering the listener on every profile navigation.
  const goBackOrCloseRef = useRef<() => void>(() => {});
  useEffect(() => {
    goBackOrCloseRef.current =
      profileHistory.length > 0 ? goBackProfile : closeProfileSheet;
  }, [profileHistory, goBackProfile, closeProfileSheet]);

  useEffect(() => {
    if (!isMobile || !isSheetOpen) return;
    const handlePopState = () => {
      pushedCountRef.current = Math.max(0, pushedCountRef.current - 1);
      goBackOrCloseRef.current();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isSheetOpen, isMobile]);

  useLayoutEffect(() => {
    if (isRequesting || isMessaging) {
      const el = scrollRef.current?.querySelector(`#${REQUEST_ID}`);
      el?.scrollIntoView();
    }
  }, [isRequesting, isMessaging]);

  if (!isMobile) return null;

  return (
    <StyledDrawer
      anchor="bottom"
      open={openProfileUserId !== null}
      onClose={closeProfileSheet}
      onOpen={() => {}}
      disableSwipeToOpen
      disableBackdropTransition={!iOS}
      disableDiscovery={iOS}
    >
      <SheetHeader>
        <Puller />
        {(openGroupChatId || selectedBadgeId || profileHistory.length > 0) && (
          <IconButton
            onClick={() => {
              if (selectedBadgeId) closeBadge();
              else if (openGroupChatId) closeGroupChat();
              else goBackProfile();
            }}
            aria-label={t("global:back")}
            size="small"
          >
            <ArrowBack />
          </IconButton>
        )}
      </SheetHeader>
      {openGroupChatId ? (
        <GroupChatView chatId={openGroupChatId} embedded />
      ) : selectedBadgeId ? (
        <ScrollContent sx={{ p: 2 }}>
          <BadgeDetail badgeId={selectedBadgeId} />
        </ScrollContent>
      ) : (
        <ScrollContent ref={scrollRef}>
          {isSuccessRequest && (
            <Snackbar severity="success">
              {t("profile:request_form.success")}
            </Snackbar>
          )}
          {isLoading && <ProfileSheetSkeleton />}
          {user && (
            <ProfileUserProvider user={user}>
              <Overview
                setIsRequesting={setIsRequesting}
                setIsMessaging={setIsMessaging}
                tab={tab}
                isInSheet
              />
              <UserCard
                tab={tab}
                onTabChange={setTab}
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
            </ProfileUserProvider>
          )}
        </ScrollContent>
      )}
    </StyledDrawer>
  );
}
