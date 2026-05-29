import { ArrowBack } from "@mui/icons-material";
import { Collapse, IconButton, styled, SwipeableDrawer } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Snackbar from "components/Snackbar";
import GroupChatView from "features/messages/groupchats/GroupChatView";
import NewHostRequest from "features/profile/view/NewHostRequest";
import NewMessage from "features/profile/view/NewMessage";
import Overview from "features/profile/view/Overview";
import UserCard from "features/profile/view/UserCard";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { CONNECTIONS, GLOBAL, MESSAGES, PROFILE } from "i18n/namespaces";
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

export default function ProfileSheet() {
  const isMobile = useIsScreenSizeOrSmaller("mobile");
  const { t, i18n } = useTranslation([GLOBAL, PROFILE, CONNECTIONS]);

  // ProfileSheet lives in the app shell and can open on any page, many of which
  // don't pre-load PROFILE or CONNECTIONS. Eagerly load them so translations
  // are ready before the sheet opens, avoiding the key-instead-of-text race.
  useEffect(() => {
    i18n.loadNamespaces([PROFILE, CONNECTIONS, MESSAGES]);
  }, [i18n]);

  const {
    openProfileUserId,
    closeProfileSheet,
    openGroupChatId,
    closeGroupChat,
  } = useProfileSheet();
  const router = useRouter();
  const { data: user, isLoading } = useUser(openProfileUserId ?? undefined);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<UserTab>("about");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSuccessRequest, setIsSuccessRequest] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  useEffect(() => {
    setTab("about");
    setIsRequesting(false);
    setIsSuccessRequest(false);
    setIsMessaging(false);
    setIsSuccessMessage(false);
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
  // layer. Push a history entry when the sheet opens so goBack() fires popstate
  // here instead of routing to the previous page.
  useEffect(() => {
    if (!isMobile || openProfileUserId === null) return;

    window.history.pushState({ profileSheetOpen: true }, "");

    const handlePopState = () => closeProfileSheet();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // Sheet closed via button — our pushed state is still on top, pop it.
      if (window.history.state?.profileSheetOpen) {
        window.history.back();
      }
    };
  }, [openProfileUserId, closeProfileSheet, isMobile]);

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
        {openGroupChatId && (
          <IconButton
            onClick={closeGroupChat}
            aria-label={t("global:back")}
            size="small"
          >
            <ArrowBack />
          </IconButton>
        )}
      </SheetHeader>
      {openGroupChatId ? (
        <GroupChatView chatId={openGroupChatId} embedded />
      ) : (
        <ScrollContent ref={scrollRef}>
          {isSuccessRequest && (
            <Snackbar severity="success">
              {t("profile:request_form.success")}
            </Snackbar>
          )}
          {isSuccessMessage && (
            <Snackbar severity="success">
              {t("profile:message_form.success")}
            </Snackbar>
          )}
          {isLoading && <CenteredSpinner />}
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
                      <NewMessage
                        setIsMessaging={setIsMessaging}
                        setIsMessageSuccess={setIsSuccessMessage}
                      />
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
