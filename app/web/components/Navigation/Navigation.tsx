import {
  AppBar,
  Badge,
  Drawer,
  IconButton,
  List,
  ListItem,
  styled,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { GlobalMessage } from "components/GlobalMessage";
import { CloseIcon, MenuIcon } from "components/Icons";
import { MenuItem } from "components/Menu";
import ExternalNavButton from "components/Navigation/ExternalNavButton";
import { useAuthContext } from "features/auth/AuthProvider";
import useNotifications from "features/useNotifications";
import { GLOBAL } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import React, { useEffect, useState } from "react";
import { TFunction } from "react-i18next";
import CouchersLogo from "resources/CouchersLogo";
import {
  blogRoute,
  dashboardRoute,
  donationsRoute,
  eventsRoute,
  faqRoute,
  featurePreviewRoute,
  forumURL,
  helpCenterURL,
  loginRoute,
  logoutRoute,
  messagesRoute,
  missionRoute,
  planRoute,
  routeToProfile,
  searchRoute,
  settingsRoute,
  signupRoute,
  teamRoute,
  volunteerRoute,
} from "routes";
import { theme } from "theme";

import GuestMenu from "./GuestMenu";
import LoggedInMenu from "./LoggedInMenu";
import NavButton from "./NavButton";

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
  t: TFunction<"global", undefined>,
  pingData: PingData
): Array<MenuItemProps> => [
  {
    name: t("nav.dashboard"),
    route: dashboardRoute,
  },
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
    name: t("nav.forum"),
    route: forumURL,
    externalLink: true,
  },
];

// shown on desktop and big screens on top of the screen
const loggedInNavMenu = (
  t: TFunction<"global", undefined>,
  pingData: PingData
): Array<MenuItemProps> => [
  {
    name: t("nav.dashboard"),
    route: dashboardRoute,
  },
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
    name: t("nav.forum"),
    route: forumURL,
    externalLink: true,
  },
];

const loggedOutNavMenu = (
  t: TFunction<"global", undefined>
): Array<MenuItemProps> => [
  {
    name: t("nav.about"),
    route: "/#",
  },
  {
    name: t("nav.blog"),
    route: blogRoute,
  },
  {
    name: t("nav.our_plan"),
    route: planRoute,
  },
  {
    name: t("nav.faq"),
    route: faqRoute,
  },
  {
    name: t("nav.mission"),
    route: missionRoute,
  },
  {
    name: t("nav.the_team"),
    route: teamRoute,
  },
  {
    name: t("nav.forum"),
    route: forumURL,
    externalLink: true,
  },
];

const loggedOutDrawerMenu = (
  t: TFunction<"global", undefined>
): Array<MenuItemProps> => [
  {
    name: t("login"),
    route: loginRoute,
  },
  {
    name: t("sign_up"),
    route: signupRoute,
  },
  {
    name: t("nav.about"),
    route: "/",
  },
  {
    name: t("nav.blog"),
    route: blogRoute,
  },
  {
    name: t("nav.our_plan"),
    route: planRoute,
  },
  {
    name: t("nav.faq"),
    route: faqRoute,
  },
  {
    name: t("nav.mission"),
    route: missionRoute,
  },
  {
    name: t("nav.the_team"),
    route: teamRoute,
  },
  {
    name: t("nav.forum"),
    route: forumURL,
    externalLink: true,
  },
];

// shown on desktop and big screens in the top right corner when logged in
const loggedInMenuDropDown = (
  t: TFunction<"global", undefined>,
  pingData: PingData
): Array<MenuItemProps> => [
  {
    name: t("nav.profile"),
    route: routeToProfile(),
    hasBottomDivider: true,
  },
  {
    name: t("nav.messages"),
    route: messagesRoute,
    notificationCount:
      (pingData?.unseenMessageCount ?? 0) +
      (pingData?.unseenReceivedHostRequestCount ?? 0) +
      (pingData?.unseenSentHostRequestCount ?? 0),
  },
  {
    name: t("nav.account_settings"),
    route: settingsRoute,
  },
  {
    name: t("nav.feature_preview"),
    route: featurePreviewRoute,
    hasBottomDivider: true,
  },
  {
    name: t("nav.help"),
    route: helpCenterURL,
  },
  {
    name: t("nav.donate"),
    route: donationsRoute,
  },
  {
    name: t("nav.volunteer"),
    route: volunteerRoute,
  },
  {
    name: t("nav.log_out"),
    route: logoutRoute,
  },
];

const drawerWidth = 240;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  bottom: "auto",
  top: 0,
  boxShadow: "0 0 4px rgba(0, 0, 0, 0.25)",
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    paddingRight: 0,
  },
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
  fontWeight: "bold",
  paddingLeft: theme.spacing(1),
  color: theme.palette.secondary.main,
  fontFamily: "'Mansalva', cursive",
  marginInlineStart: theme.spacing(1.5),
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  justifyContent: "space-between",
  paddingLeft: 0,
  paddingRight: 0,
}));

const StyledNav = styled("div")(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  flex: 0,
}));

const StyledMenuContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  "& > *": { marginInlineStart: theme.spacing(2) },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: "-4px",
    top: "4px",
  },
}));

const StyledMenuItemLink = styled("a")(({ theme }) => ({
  width: "100%",
}));

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: pingData } = useNotifications();
  const { authState } = useAuthContext();

  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => setIsMounted(true), []);

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
          )
        )}
      </List>
    </div>
  );

  const loggedMenuItems = loggedInMenuDropDown(t, pingData).map(
    ({ name, notificationCount, route, externalLink, hasBottomDivider }) => {
      const hasNotification =
        notificationCount !== undefined && notificationCount > 0;

      const linkContent = (
        <>
          {hasNotification ? (
            <StyledBadge color="primary" variant="dot">
              <Typography noWrap>{name}</Typography>
            </StyledBadge>
          ) : (
            <Typography noWrap>{name}</Typography>
          )}

          {hasNotification ? (
            <Typography
              noWrap
              variant="subtitle2"
              sx={{ color: theme.palette.grey[500], fontWeight: "bold" }}
            >
              {`${notificationCount} unseen`}
            </Typography>
          ) : null}
        </>
      );

      return (
        <MenuItem
          key={name}
          hasNotification={hasNotification}
          hasBottomDivider={hasBottomDivider}
        >
          {externalLink ? (
            <StyledMenuItemLink
              href={route}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              {linkContent}
            </StyledMenuItemLink>
          ) : (
            <Link href={route}>
              <StyledMenuItemLink onClick={() => setMenuOpen(false)}>
                {linkContent}
              </StyledMenuItemLink>
            </Link>
          )}
        </MenuItem>
      );
    }
  );

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
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
                anchor="left"
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
          <CouchersLogo />
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
                  )
              )}
            </StyledFlexbox>
          )}
        </StyledNav>
        <StyledMenuContainer>
          {authState.authenticated && isMounted ? (
            <LoggedInMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
              {loggedMenuItems}
            </LoggedInMenu>
          ) : (
            <GuestMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          )}
        </StyledMenuContainer>
      </StyledToolbar>
      <GlobalMessage />
    </StyledAppBar>
  );
}
