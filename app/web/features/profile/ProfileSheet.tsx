import { ArrowBack, Close } from "@mui/icons-material";
import { Collapse, Drawer, IconButton, styled } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import Snackbar from "components/Snackbar";
import GroupChatView from "features/messages/groupchats/GroupChatView";
import NewHostRequest from "features/profile/view/NewHostRequest";
import NewMessage from "features/profile/view/NewMessage";
import Overview from "features/profile/view/Overview";
import UserCard from "features/profile/view/UserCard";
import { useProfile } from "features/userQueries/useProfile";
import { useUser } from "features/userQueries/useUsers";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { UserTab } from "routes";
import { useIsNativeEmbed } from "utils/nativeLink";

import { ProfileUserProvider } from "./hooks/useProfileUser";
import { useProfileSheet } from "./ProfileSheetContext";

const StyledDrawer = styled(Drawer)({
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

const SheetHeader = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  padding: theme.spacing(1, 1, 0),
  flexShrink: 0,
  backgroundColor: "var(--mui-palette-background-paper)",
}));

const ScrollContent = styled("div")({
  overflowY: "auto",
  flexGrow: 1,
  WebkitOverflowScrolling: "touch",
});

const REQUEST_ID = "request";

export default function ProfileSheet() {
  const isNativeEmbed = useIsNativeEmbed();
  const {
    openProfileUserId,
    closeProfileSheet,
    openGroupChatId,
    closeGroupChat,
  } = useProfileSheet();
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const router = useRouter();
  const { data: user, isLoading } = useUser(openProfileUserId ?? undefined);
  const { data: profile, isLoading: isProfileLoading } = useProfile(
    openProfileUserId ?? undefined,
  );
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
    router.events.on("routeChangeStart", closeProfileSheet);
    return () => router.events.off("routeChangeStart", closeProfileSheet);
  }, [router.events, closeProfileSheet]);

  useLayoutEffect(() => {
    if (isRequesting || isMessaging) {
      const el = scrollRef.current?.querySelector(`#${REQUEST_ID}`);
      el?.scrollIntoView();
    }
  }, [isRequesting, isMessaging]);

  if (!isNativeEmbed) return null;

  return (
    <StyledDrawer
      anchor="bottom"
      open={openProfileUserId !== null}
      onClose={closeProfileSheet}
    >
      <SheetHeader>
        <IconButton
          onClick={openGroupChatId ? closeGroupChat : closeProfileSheet}
          aria-label={openGroupChatId ? t("global:back") : t("global:close")}
          size="small"
        >
          {openGroupChatId ? <ArrowBack /> : <Close />}
        </IconButton>
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
          {(isLoading || isProfileLoading) && <CenteredSpinner />}
          {user && profile && (
            <ProfileUserProvider user={user} profile={profile}>
              <Overview
                setIsRequesting={setIsRequesting}
                setIsMessaging={setIsMessaging}
                tab={tab}
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
