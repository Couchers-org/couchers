import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  Toolbar,
  styled,
  useMediaQuery,
} from "@mui/material";
import { TFunction } from "i18next";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";

import Button from "@/components/Button";
import { GlobalMessage } from "@/components/GlobalMessage";
import { CloseIcon, MenuIcon } from "@/components/Icons";
import ExternalNavButton from "@/components/Navigation/ExternalNavButton";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { PushNotificationBanner } from "@/features/notifications/PushNotificationBanner";
import LanguagePickerSelect from "@/features/translate/LanguagePickerSelect";
import useNotifications from "@/features/useNotifications";
import { GLOBAL } from "@/i18n/namespaces";
import CouchersLogo from "@/resources/CouchersLogo";
import {
  BLOG_ROUTE,
  COMMUNITIES_ROUTE,
  DASHBOARD_ROUTE,
  DONATIONS_ROUTE,
  EVENTS_ROUTE,
  FEATURE_PREVIEW_ROUTE,
  HELP_CENTER_URL,
  LOGIN_ROUTE,
  LOGOUT_ROUTE,
  MESSAGES_ROUTE,
  MISSION_ROUTE,
  PLAN_ROUTE,
  SEARCH_ROUTE,
  SETTINGS_ROUTE,
  SIGNUP_ROUTE,
  VOLUNTEER_ROUTE,
  routeToProfile,
} from "@/routes";
import { theme } from "@/theme";

import LoggedInMenu, { LoggedInMenuItem } from "./LoggedInMenu";
import NavButton from "./NavButton";
import ReportDialog from "./ReportDialog";

interface MenuItemProps {
  name: string;
  route: string;
  notificationCount?: number;
  externalLink?: boolean;
  hasBottomDivider?: boolean;
}

type PingData = ReturnType<typeof useNotifications>["data"];

// shown on mobile/small screens
const loggedInDrawerMenu = (
  t: TFunction<"global">,
  pingData: PingData,
): Array<MenuItemProps> => [
  {
    name: t("nav.dashboard"),
    route: DASHBOARD_ROUTE,
  },
  {
    name: t("nav.messages"),
    route: MESSAGES_ROUTE,
    notificationCount:
      (pingData?.unseenMessageCount ?? 0) +
      (pingData?.unseenReceivedHostRequestCount ?? 0) +
      (pingData?.unseenSentHostRequestCount ?? 0),
  },
  {
    name: t("nav.map_search"),
    route: SEARCH_ROUTE,
  },
  {
    name: t("nav.events"),
    route: EVENTS_ROUTE,
  },
  {
    name: t("nav.communities"),
    route: COMMUNITIES_ROUTE,
  },
];

// shown on desktop and big screens on top of the screen
const loggedInNavMenu = (
  t: TFunction<"global">,
  pingData: PingData,
): Array<MenuItemProps> => [
  {
    name: t("nav.dashboard"),
    route: DASHBOARD_ROUTE,
  },
  {
    name: t("nav.messages"),
    route: MESSAGES_ROUTE,
    notificationCount:
      (pingData?.unseenMessageCount ?? 0) +
      (pingData?.unseenReceivedHostRequestCount ?? 0) +
      (pingData?.unseenSentHostRequestCount ?? 0),
  },
  {
    name: t("nav.map_search"),
    route: SEARCH_ROUTE,
  },
  {
    name: t("nav.events"),
    route: EVENTS_ROUTE,
  },
  {
    name: t("nav.communities"),
    route: COMMUNITIES_ROUTE,
  },
];

const loggedOutNavMenu = (t: TFunction<"global">): Array<MenuItemProps> => [
  {
    name: t("nav.blog"),
    route: BLOG_ROUTE,
  },
  {
    name: t("nav.our_plan"),
    route: PLAN_ROUTE,
  },
  {
    name: t("nav.mission"),
    route: MISSION_ROUTE,
  },
];

const loggedOutDrawerMenu = (t: TFunction<"global">): Array<MenuItemProps> => [
  {
    name: t("nav.blog"),
    route: BLOG_ROUTE,
  },
  {
    name: t("nav.our_plan"),
    route: PLAN_ROUTE,
  },
  {
    name: t("nav.mission"),
    route: MISSION_ROUTE,
  },
];

// shown on desktop and big screens in the top right corner when logged in
const loggedInMenuDropDown = (
  t: TFunction<"global">,
  pingData: PingData,
): Array<LoggedInMenuItem> => [
  {
    type: "link",
    name: t("nav.profile"),
    route: routeToProfile(),
    hasBottomDivider: true,
  },
  {
    type: "link",
    name: t("nav.messages"),
    route: MESSAGES_ROUTE,
    notificationCount:
      (pingData?.unseenMessageCount ?? 0) +
      (pingData?.unseenReceivedHostRequestCount ?? 0) +
      (pingData?.unseenSentHostRequestCount ?? 0),
  },
  {
    type: "link",
    name: t("nav.account_settings"),
    route: SETTINGS_ROUTE,
  },
  {
    type: "link",
    name: t("nav.feature_preview"),
    route: FEATURE_PREVIEW_ROUTE,
    hasBottomDivider: true,
  },
  {
    type: "link",
    name: t("nav.help_center"),
    route: HELP_CENTER_URL,
    externalLink: true,
  },
  {
    type: "link",
    name: t("nav.donate"),
    route: DONATIONS_ROUTE,
  },
  {
    type: "link",
    name: t("nav.volunteer"),
    route: VOLUNTEER_ROUTE,
  },
  {
    type: "dialog",
    name: t("report.label"),
    dialogComponent: ReportDialog,
    dialogLabel: t("report.label"),
    hasBottomDivider: true,
  },
  {
    type: "link",
    name: t("nav.log_out"),
    route: LOGOUT_ROUTE,
  },
];

const drawerWidth = 240;

const StyledAppBar = styled(AppBar)(() => ({
  bottom: "auto",
  top: 0,
  boxShadow: "none",
  backgroundColor: theme.palette.common.white,
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    paddingRight: 0,
  },
}));

const StyledFlexbox = styled("div")(() => ({
  display: "flex",
  flex: 0,
  justifyContent: "flex-start",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  width: "auto",
}));

const StyledDrawerHeader = styled("div")(() => ({
  display: "flex",
  justifyContent: "space-between",
}));

const StyledDrawer = styled(Drawer)(() => ({
  padding: theme.spacing(2),
  width: drawerWidth,
}));

const StyledDrawerTitle = styled("div")(() => ({
  alignSelf: "center",
  fontSize: "1.5rem",
  fontWeight: 400,
  paddingLeft: theme.spacing(1),
  color: theme.palette.secondary.main,
  fontFamily: "Mansalva, cursive",
  marginInlineStart: theme.spacing(1.5),
}));

const StyledToolbar = styled(Toolbar)(() => ({
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  justifyContent: "space-between",
  paddingLeft: 0,
  paddingRight: 0,
}));

const StyledNav = styled("div")(() => ({
  alignItems: "center",
  display: "flex",
  flex: 0,
}));

const StyledMenuContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
}));

const Navigation = () => {
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: pingData } = useNotifications();
  const { authState } = useAuthContext();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { t } = useTranslation(GLOBAL);

  const drawerItems = (
    <div>
      <List>
        {(authState.authenticated && isMounted
          ? loggedInDrawerMenu
          : loggedOutDrawerMenu)(t, pingData).map(
          ({ name, route, notificationCount, externalLink }) => (
            <ListItem
              component="button"
              key={name}
              sx={{
                background: "transparent",
                border: "none",

                "&:hover": {
                  backgroundColor: theme.palette.grey[200],
                },
              }}
            >
              {externalLink ? (
                <ExternalNavButton
                  route={route}
                  label={name}
                  labelVariant="h2"
                />
              ) : (
                <NavButton
                  route={route}
                  label={name}
                  labelVariant="h2"
                  notificationCount={notificationCount}
                />
              )}
            </ListItem>
          ),
        )}
        <ListItem
          sx={{
            display: "flex",
            flex: "1",
            maxWidth: "10.5rem",
            padding: theme.spacing(1, 4),
          }}
        >
          <LanguagePickerSelect />
        </ListItem>
      </List>
    </div>
  );

  const loggedInMenuItems = useMemo(
    () => loggedInMenuDropDown(t, pingData),
    [t, pingData],
  );

  const handleDrawerOpen = () => {
    setIsOpen(true);
  };

  const handleDrawerClose = () => {
    setIsOpen(false);
  };

  return (
    <StyledAppBar position="sticky" color="inherit">
      <StyledToolbar>
        <StyledNav>
          {isMobile && (
            <>
              <IconButton
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{ marginLeft: theme.spacing(1) }}
              >
                <MenuIcon
                  sx={{ color: theme.palette.text.primary, fontSize: 24 }}
                />
              </IconButton>
              <StyledDrawer
                variant="temporary"
                anchor="right"
                open={isOpen}
                onClick={handleDrawerClose}
                ModalProps={{
                  keepMounted: true, // better open performance on mobile
                  onClose: handleDrawerClose,
                }}
              >
                <StyledDrawerHeader>
                  <StyledDrawerTitle>{t("couchers")}</StyledDrawerTitle>
                  <IconButton
                    aria-label="close drawer"
                    onClick={handleDrawerClose}
                    sx={{ marginLeft: theme.spacing(1) }}
                  >
                    <CloseIcon />
                  </IconButton>
                </StyledDrawerHeader>
                {drawerItems}
              </StyledDrawer>
            </>
          )}
          <CouchersLogo isLoggedIn={authState.authenticated} />
          {!isMobile && (
            <StyledFlexbox>
              {(authState.authenticated && isMounted
                ? loggedInNavMenu
                : loggedOutNavMenu)(t, pingData).map(
                ({ name, route, notificationCount, externalLink }) =>
                  externalLink ? (
                    <ExternalNavButton
                      route={route}
                      label={name}
                      labelVariant="h3"
                      key={`${name}-nav-button`}
                    />
                  ) : (
                    <NavButton
                      route={route}
                      label={name}
                      key={`${name}-nav-button`}
                      notificationCount={notificationCount}
                    />
                  ),
              )}
            </StyledFlexbox>
          )}
        </StyledNav>
        <StyledMenuContainer>
          {authState.authenticated && isMounted ? (
            <LoggedInMenu
              menuOpen={isMenuOpen}
              notificationCount={pingData?.unseenNotificationCount}
              setMenuOpen={setIsMenuOpen}
              items={loggedInMenuItems}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 2,
              }}
            >
              {!isMobile && <LanguagePickerSelect />}
              <Button
                variant="outlined"
                size={isMobile ? "medium" : "large"}
                sx={{
                  fontSize: "1.3rem",
                  borderRadius: theme.spacing(1),
                  border: `1.5px solid ${theme.palette.primary.main}`,
                }}
                onClick={() => router.push(LOGIN_ROUTE)}
              >
                {t("login")}
              </Button>
              {!isMobile && (
                <Button
                  variant="contained"
                  size={"large"}
                  sx={{ fontSize: "1.3rem" }}
                  onClick={() => router.push(SIGNUP_ROUTE)}
                >
                  {t("join_us")}
                </Button>
              )}
            </Box>
          )}
        </StyledMenuContainer>
      </StyledToolbar>
      <GlobalMessage />
      <PushNotificationBanner />
    </StyledAppBar>
  );
};

export default Navigation;
