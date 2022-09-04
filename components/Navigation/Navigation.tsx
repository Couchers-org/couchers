import {
  AppBar,
  Badge,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { grey } from "@material-ui/core/colors";
import classNames from "classnames";
import Button from "components/Button";
import { CloseIcon, MenuIcon } from "components/Icons";
import { MenuItem } from "components/Menu";
import ExternalNavButton from "components/Navigation/ExternalNavButton";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
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
  handbookRoute,
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
import makeStyles from "utils/makeStyles";

import LoggedInMenu from "./LoggedInMenu";
import NavButton from "./NavButton";
import ReportButton from "./ReportButton";

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
    route: handbookRoute,
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

const useStyles = makeStyles((theme) => ({
  appBar: {
    bottom: "auto",
    top: 0,
    boxShadow: "0 0 4px rgba(0, 0, 0, 0.25)",
  },
  flex: {
    display: "flex",
    flex: 0,
    justifyContent: "flex-start",
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    width: "auto",
  },
  drawerPaper: {
    padding: theme.spacing(2),
    width: drawerWidth,
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
  },
  drawerTitle: {
    alignSelf: "center",
    fontSize: "1.5rem",
    fontWeight: "bold",
    paddingLeft: theme.spacing(1),
  },
  logoText: {
    marginInlineStart: theme.spacing(3),
  },
  gutters: {
    [theme.breakpoints.up("md")]: {
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
    justifyContent: "space-between",
    paddingLeft: 0,
    paddingRight: 0,
  },
  nav: {
    alignItems: "center",
    display: "flex",
    flex: 0,
  },
  icon: {
    marginLeft: theme.spacing(1),
  },
  bug: {
    alignItems: "center",
    display: "flex",
    [theme.breakpoints.down("sm")]: {
      paddingRight: theme.spacing(2),
    },
  },
  title: {
    alignSelf: "center",
    fontWeight: "bold",
  },
  menuContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    "& > *": { marginInlineStart: theme.spacing(2) },
  },
  menu: {
    boxShadow: theme.shadows[1],
    minWidth: "12rem",
  },
  menuPopover: {
    transform: "translateY(1rem)",
  },
  notificationCount: {
    color: grey[500],
    fontWeight: "bold",
  },
  menuBtn: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    border: `1px solid ${grey[300]}`,
    borderRadius: 999,
    backgroundColor: grey[200],
    padding: theme.spacing(1),
    transition: `${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    "&:hover": {
      opacity: 0.8,
      backgroundColor: grey[300],
    },
  },
  avatar: {
    height: "2rem",
    width: "2rem",
  },
  badge: {
    "& .MuiBadge-badge": {
      right: "-4px",
      top: "4px",
    },
  },
  menuItemLink: {
    width: "100%",
  },
}));

export default function Navigation() {
  const authClasses = useAuthStyles();
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: pingData } = useNotifications();
  const { authState } = useAuthContext();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const { t } = useTranslation(GLOBAL);

  const drawerItems = (
    <div>
      <List>
        {(authState.authenticated && isMounted
          ? loggedInDrawerMenu
          : loggedOutDrawerMenu)(t, pingData).map(
          ({ name, route, notificationCount, externalLink }) => (
            <ListItem button key={name}>
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

  const menuItems = loggedInMenuDropDown(t, pingData).map(
    ({ name, notificationCount, route, externalLink, hasBottomDivider }) => {
      const hasNotification =
        notificationCount !== undefined && notificationCount > 0;

      const linkContent = (
        <>
          {hasNotification ? (
            <Badge color="primary" variant="dot" className={classes.badge}>
              <Typography noWrap>{name}</Typography>
            </Badge>
          ) : (
            <Typography noWrap>{name}</Typography>
          )}

          {hasNotification ? (
            <Typography
              noWrap
              variant="subtitle2"
              className={classes.notificationCount}
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
            <a
              href={route}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className={classes.menuItemLink}
            >
              {linkContent}
            </a>
          ) : (
            <Link href={route}>
              <a
                onClick={() => setMenuOpen(false)}
                className={classes.menuItemLink}
              >
                {linkContent}
              </a>
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
    <AppBar
      position="sticky"
      classes={{
        root: classes.appBar,
      }}
      color="inherit"
    >
      <Toolbar
        classes={{
          gutters: classes.gutters,
        }}
      >
        <div className={classes.nav}>
          <Hidden mdUp implementation="css">
            <IconButton
              className={classes.icon}
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              variant="temporary"
              anchor="left"
              open={open}
              onClick={handleDrawerClose}
              ModalProps={{
                keepMounted: true, // better open performance on mobile
                onClose: handleDrawerClose,
              }}
              classes={{
                paper: classes.drawerPaper,
              }}
            >
              <div className={classes.drawerHeader}>
                <div
                  className={classNames(authClasses.logo, classes.drawerTitle)}
                >
                  {t("couchers")}
                </div>
                <IconButton
                  className={classes.icon}
                  aria-label="close drawer"
                  onClick={handleDrawerClose}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              {drawerItems}
            </Drawer>
          </Hidden>
          <CouchersLogo />
          <Hidden smDown implementation="css">
            <div className={classes.flex}>
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
            </div>
          </Hidden>
        </div>

        <Hidden implementation="css">
          <div className={classes.menuContainer}>
            <ReportButton />
            {authState.authenticated && isMounted ? (
              <LoggedInMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
                {menuItems}
              </LoggedInMenu>
            ) : (
              <>
                <Hidden smDown implementation="css">
                  <Link href={signupRoute} passHref>
                    <Button variant="contained" color="secondary">
                      {t("sign_up")}
                    </Button>
                  </Link>
                </Hidden>
                <Link href={loginRoute} passHref>
                  <Button variant="outlined">{t("login")}</Button>
                </Link>
              </>
            )}
          </div>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
}
