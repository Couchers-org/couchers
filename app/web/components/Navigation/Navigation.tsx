import { AppBar, Box, Drawer, IconButton, List, ListItem, styled, Theme, Toolbar, useMediaQuery } from "@mui/material";
import Button from "components/Button";
import { GlobalMessage } from "components/GlobalMessage";
import { CloseIcon, MenuIcon } from "components/Icons";
import ExternalNavButton from "components/Navigation/ExternalNavButton";
import { useAuthContext } from "features/auth/AuthProvider";
import { DonationBanner } from "features/donations/DonationBanner";
import LanguagePickerSelect from "features/translate/LanguagePickerSelect";
import useNotifications from "features/useNotifications";
import { GLOBAL } from "i18n/namespaces";
import { TFunction } from "i18next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import React, { useEffect, useMemo, useState } from "react";
import CouchersLogo from "resources/CouchersLogo";
import {
  blogRoute,
  communitiesRoute,
  donationsRoute,
  eventsRoute,
  helpCenterURL,
  inviteCodesRoute,
  loginRoute,
  logoutRoute,
  messagesRoute,
  missionRoute,
  planRoute,
  routeToProfile,
  searchRoute,
  settingsRoute,
  shopRoute,
  signupRoute,
  volunteerRoute,
} from "routes";
import { theme } from "theme";
import { useIsNativeEmbed } from "utils/nativeLink";

import BottomNavigation from "./BottomNavigation";
import DarkModeToggle from "./DarkModeToggle";
import LoggedInMenu, { LoggedInMenuItem } from "./LoggedInMenu";
import NavButton from "./NavButton";
import ReportButton from "./ReportButton";
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
const loggedInDrawerMenu = (t: TFunction<"global", undefined>, pingData: PingData): Array<MenuItemProps> => [
  {
    name: t("nav.messages"),
    route: messagesRoute,
    notificationCount:
      (pingData?.unseenMessageCount ?? 0) +
      (pingData?.unseenReceivedHostRequestCount ?? 0) +
      (pingData?.unseenSentHostRequestCount ?? 0),
  },
  {
    name: t("nav.map_search"),
    route: searchRoute,
  },
  {
    name: t("nav.events"),
    route: eventsRoute,
  },
  {
    name: t("nav.communities"),
    route: communitiesRoute,
  },
];

// shown on desktop and big screens on top of the screen
const loggedInNavMenu = (t: TFunction<"global", undefined>, pingData: PingData): Array<MenuItemProps> => [
  {
    name: t("nav.messages"),
    route: messagesRoute,
    notificationCount:
      (pingData?.unseenMessageCount ?? 0) +
      (pingData?.unseenReceivedHostRequestCount ?? 0) +
      (pingData?.unseenSentHostRequestCount ?? 0),
  },
  {
    name: t("nav.map_search"),
    route: searchRoute,
  },
  {
    name: t("nav.events"),
    route: eventsRoute,
  },
  {
    name: t("nav.communities"),
    route: communitiesRoute,
  },
];

const loggedOutNavMenu = (t: TFunction<"global", undefined>): Array<MenuItemProps> => [
  {
    name: t("nav.blog"),
    route: blogRoute,
  },
  {
    name: t("nav.our_plan"),
    route: planRoute,
  },
  {
    name: t("nav.mission"),
    route: missionRoute,
  },
];

const loggedOutDrawerMenu = (t: TFunction<"global", undefined>): Array<MenuItemProps> => [
  {
    name: t("nav.blog"),
    route: blogRoute,
  },
  {
    name: t("nav.our_plan"),
    route: planRoute,
  },
  {
    name: t("nav.mission"),
    route: missionRoute,
  },
];

// shown on desktop and big screens in the top right corner when logged in
const loggedInMenuDropDown = (t: TFunction<"global", undefined>, isNativeEmbed: boolean): Array<LoggedInMenuItem> => [
  {
    type: "link",
    name: t("nav.profile"),
    route: routeToProfile(),
    hasBottomDivider: true,
  },
  {
    type: "link",
    name: t("nav.account_settings"),
    route: settingsRoute,
  },
  {
    type: "link",
    name: t("nav.invite_members"),
    route: inviteCodesRoute,
    hasBottomDivider: true,
  },
  {
    type: "link",
    name: t("nav.help_center"),
    route: helpCenterURL,
    externalLink: true,
  },
  ...(isNativeEmbed
    ? []
    : [
        {
          type: "link" as const,
          name: t("nav.donate"),
          route: donationsRoute,
        },
      ]),
  {
    type: "link",
    name: t("nav.volunteer"),
    route: volunteerRoute,
  },
  {
    type: "dialog",
    name: t("report.label"),
    dialogComponent: ReportDialog,
    dialogLabel: t("report.label"),
  },
  {
    type: "link",
    name: t("nav.merch_shop"),
    route: shopRoute,
    hasBottomDivider: true,
  },
  {
    type: "link",
    name: t("nav.log_out"),
    route: logoutRoute,
  },
];

const drawerWidth = 240;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  bottom: "auto",
  top: 0,
  boxShadow: "none",
}));

const StyledFlexbox = styled("div")(({ theme }) => ({
  display: "flex",
  flex: 0,
  justifyContent: "flex-start",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  width: "auto",
}));

const StyledDrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  padding: theme.spacing(2),
  width: drawerWidth,
}));

const StyledDrawerTitle = styled("div")(({ theme }) => ({
  alignSelf: "center",
  fontSize: "1.5rem",
  fontWeight: 400,
  paddingLeft: theme.spacing(1),
  color: theme.palette.secondary.main,
  fontFamily: "Mansalva, cursive",
  marginInlineStart: theme.spacing(1.5),
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  justifyContent: "space-between",
  paddingLeft: 0,
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
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

export default function Navigation() {
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isLoginPage = router.pathname === loginRoute;

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { data: pingData } = useNotifications();
  const { authState } = useAuthContext();
  const isAuthenticated = isMounted && authState.authenticated;
  const isNativeEmbed = useIsNativeEmbed();

  const { t } = useTranslation(GLOBAL);

  const shouldShowLanguagePickerSelect = useMemo(() => {
    if (!isMobile) return true;

    if (isMobile && authState.authenticated) return true;

    return false;
  }, [authState.authenticated, isMobile]);

  useEffect(() => setIsMounted(true), []);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const drawerItems = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
      }}
    >
      <List>
        {(isAuthenticated ? loggedInDrawerMenu : loggedOutDrawerMenu)(t, pingData).map(
          ({ name, route, notificationCount, externalLink }) => (
            <ListItem
              component="button"
              key={name}
              sx={{
                background: "transparent",
                border: "none",

                "&:hover": {
                  backgroundColor: (theme) => theme.palette.grey[200],
                },
              }}
            >
              {externalLink ? (
                <ExternalNavButton route={route} label={name} labelVariant="h2" />
              ) : (
                <NavButton route={route} label={name} labelVariant="h2" notificationCount={notificationCount} />
              )}
            </ListItem>
          ),
        )}
      </List>

      <Box sx={{ marginX: "auto", marginBottom: theme.spacing(2) }} onClick={(e) => e.stopPropagation()}>
        <LanguagePickerSelect />
      </Box>
    </Box>
  );

  const loggedInMenuItems = useMemo(() => loggedInMenuDropDown(t, isNativeEmbed), [t, isNativeEmbed]);

  return (
    <StyledAppBar position="sticky" color="inherit">
      <StyledToolbar>
        <StyledNav sx={{ marginLeft: 2 }}>
          {isMobile && !isAuthenticated && (
            <>
              <IconButton aria-label={t("nav.open_drawer_a11y")} onClick={handleDrawerOpen} edge="start">
                <MenuIcon
                  sx={{
                    color: "var(--mui-palette-text-primary)",
                    fontSize: 24,
                  }}
                />
              </IconButton>
              <StyledDrawer
                variant="temporary"
                anchor="right"
                open={open}
                onClick={handleDrawerClose}
                ModalProps={{
                  keepMounted: true, // better open performance on mobile
                  onClose: handleDrawerClose,
                }}
              >
                <StyledDrawerHeader>
                  <StyledDrawerTitle>{t("couchers")}</StyledDrawerTitle>
                  <IconButton
                    aria-label={t("nav.close_drawer_a11y")}
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
          <Box sx={{ display: "inline-flex", alignItems: "center" }}>
            <CouchersLogo isLoggedIn={isAuthenticated} />
          </Box>

          {!isMobile && (
            <StyledFlexbox>
              {(isAuthenticated ? loggedInNavMenu : loggedOutNavMenu)(t, pingData).map(
                ({ name, route, notificationCount, externalLink }) =>
                  externalLink ? (
                    <ExternalNavButton route={route} label={name} labelVariant="h3" key={`${name}-nav-button`} />
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
          <Box sx={{ display: "flex", gap: 0.5, marginRight: 0.5 }}>
            {isNativeEmbed && <ReportButton />}
            <DarkModeToggle />
          </Box>
          {isAuthenticated ? (
            <>
              <LoggedInMenu
                menuOpen={menuOpen}
                notificationCount={pingData?.unseenNotificationCount}
                setMenuOpen={setMenuOpen}
                items={loggedInMenuItems}
              />
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 2,
              }}
            >
              {shouldShowLanguagePickerSelect && <LanguagePickerSelect displayMode="icon" />}
              {!isLoginPage && (
                <Button
                  variant="outlined"
                  size={isMobile ? "medium" : "large"}
                  sx={{
                    fontSize: "1.3rem",
                    borderRadius: theme.spacing(1),
                    border: (theme: Theme) => `1.5px solid var(--mui-palette-primary-main)`,
                  }}
                  onClick={() => router.push(loginRoute)}
                >
                  {t("login")}
                </Button>
              )}
              {isLoginPage && (
                <Button
                  variant="contained"
                  size={isMobile ? "medium" : "large"}
                  sx={{ fontSize: "1.3rem" }}
                  onClick={() => router.push(signupRoute)}
                >
                  {t("join_us")}
                </Button>
              )}
            </Box>
          )}
        </StyledMenuContainer>
      </StyledToolbar>
      <GlobalMessage />
      {!isNativeEmbed && isAuthenticated && <DonationBanner />}
      {/* Bottom navigation for mobile browsers only (not native app) when logged in */}
      {isMobile && !isNativeEmbed && isAuthenticated && <BottomNavigation />}
    </StyledAppBar>
  );
}
