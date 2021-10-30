import {
  AppBar,
  Badge,
  Button,
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
import Avatar from "components/Avatar";
import { CloseIcon, MenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import ExternalNavButton from "components/Navigation/ExternalNavButton";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import useNotifications from "features/useNotifications";
import useCurrentUser from "features/userQueries/useCurrentUser";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import CouchersLogo from "resources/CouchersLogo";
import {
  donationsRoute,
  eventsRoute,
  handbookURL,
  logoutRoute,
  messagesRoute,
  routeToProfile,
  searchRoute,
  settingsRoute,
} from "routes";
import makeStyles from "utils/makeStyles";

import {
  COUCHERS,
  DASHBOARD,
  DONATE,
  EVENTS,
  HELP,
  LOG_OUT,
  MAP_SEARCH,
  MESSAGES,
  PROFILE,
} from "../../appConstants";
import NavButton from "./NavButton";
import ReportButton from "./ReportButton";

const menu = (data: ReturnType<typeof useNotifications>["data"]) => [
  {
    name: DASHBOARD,
    route: "/",
  },
  {
    name: MESSAGES,
    route: messagesRoute,
    notificationCount:
      (data?.unseenMessageCount ?? 0) +
      (data?.unseenReceivedHostRequestCount ?? 0) +
      (data?.unseenSentHostRequestCount ?? 0),
  },
  {
    name: MAP_SEARCH,
    route: searchRoute,
  },
  {
    name: PROFILE,
    route: routeToProfile(),
  },
  {
    name: EVENTS,
    route: eventsRoute,
  },
];

const menuDropDown = (data: ReturnType<typeof useNotifications>["data"]) => [
  {
    name: PROFILE,
    route: routeToProfile(),
    hasBottomDivider: true,
  },
  {
    name: MESSAGES,
    route: messagesRoute,
    notificationCount:
      (data?.unseenMessageCount ?? 0) +
      (data?.unseenReceivedHostRequestCount ?? 0) +
      (data?.unseenSentHostRequestCount ?? 0),
  },
  {
    name: "Account",
    route: settingsRoute,
    hasBottomDivider: true,
  },
  {
    name: HELP,
    target: "_blank",
    route: handbookURL,
    externalLink: true,
  },
  {
    name: DONATE,
    route: donationsRoute,
  },
  {
    name: LOG_OUT,
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
  const authenticated = useAuthContext().authState.authenticated;
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLButtonElement>(null);
  const { data } = useNotifications();
  const { data: user } = useCurrentUser();

  const drawerItems = (
    <div>
      <List>
        {menu(data).map(({ name, route, notificationCount }) => (
          <ListItem button key={name}>
            <NavButton
              route={route}
              label={name}
              labelVariant="h2"
              notificationCount={notificationCount}
            />
          </ListItem>
        ))}
        <ListItem button>
          <ExternalNavButton
            route={handbookURL}
            label={HELP}
            labelVariant="h2"
          />
        </ListItem>
        <ListItem button>
          <NavButton route={logoutRoute} label={LOG_OUT} labelVariant="h2" />
        </ListItem>
      </List>
    </div>
  );

  const menuItems = menuDropDown(data).map(
    ({
      name,
      notificationCount,
      route,
      target,
      externalLink,
      hasBottomDivider,
    }) => {
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
          hasNotification={hasNotification}
          hasBottomDivider={hasBottomDivider}
        >
          {externalLink ? (
            <a
              href={route}
              key={name}
              target={target}
              onClick={() => setMenuOpen(false)}
              className={classes.menuItemLink}
            >
              {linkContent}
            </a>
          ) : (
            <Link
              to={route}
              target={target}
              key={name}
              onClick={() => setMenuOpen(false)}
              className={classes.menuItemLink}
            >
              {linkContent}
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

  if (!authenticated) {
    return null;
  }

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
          <Hidden mdUp>
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
                  {COUCHERS}
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
          <Hidden smDown>
            <div className={classes.flex}>
              {menu(data).map(({ name, route, notificationCount }) => (
                <NavButton
                  route={route}
                  label={name}
                  key={`${name}-nav-button`}
                  notificationCount={notificationCount}
                />
              ))}
            </div>
          </Hidden>
        </div>

        <Hidden smDown>
          <div className={classes.menuContainer}>
            <ReportButton />
            <Button
              aria-controls="navigation-menu"
              aria-haspopup="true"
              className={classes.menuBtn}
              onClick={() =>
                setMenuOpen((prevMenuOpen: boolean) => !prevMenuOpen)
              }
              ref={menuRef}
            >
              <MenuIcon />
              <Avatar
                user={user}
                className={classes.avatar}
                isProfileLink={false}
              />
            </Button>
          </div>

          <Menu
            id="navigation-menu"
            open={menuOpen}
            anchorEl={menuRef.current}
            onClose={() => setMenuOpen(false)}
            classes={{
              paper: classes.menu,
            }}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            getContentAnchorEl={null}
            PopoverClasses={{
              root: classes.menuPopover,
            }}
          >
            {menuItems}
          </Menu>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
}
