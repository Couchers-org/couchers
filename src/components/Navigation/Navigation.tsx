import {
  AppBar,
  Avatar,
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
import { CloseIcon, MenuIcon } from "components/Icons";
import Menu, { MenuItem } from "components/Menu";
import ExternalNavButton from "components/Navigation/ExternalNavButton";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import ReportButton from "features/ReportButton";
import useNotifications from "features/useNotifications";
import useCurrentUser from "features/userQueries/useCurrentUser";
import React from "react";
import CouchersLogo from "resources/CouchersLogo";
import {
  donationsRoute,
  eventsRoute,
  handbookURL,
  logoutRoute,
  messagesRoute,
  routeToProfile,
  searchRoute,
} from "routes";
import makeStyles from "utils/makeStyles";
import { acronym } from "utils/names";

import {
  COUCHERS,
  DASHBOARD,
  EVENTS,
  HELP,
  LOG_OUT,
  MAP_SEARCH,
  MESSAGES,
  PROFILE,
} from "../../constants";
import NavButton from "./NavButton";

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
    name: "Profile",
    title: true,
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
    route: routeToProfile(),
  },
  {
    name: HELP,
    target: "_blank",
    route: handbookURL,
  },
  {
    name: "Donate",
    route: donationsRoute,
  },
  {
    name: "Sign out",
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
  menu: {
    boxShadow: theme.shadows[1],
    minWidth: "12rem",
  },
  menuPopover: {
    transform: "translateY(2rem)",
  },
  menuTitle: {
    fontWeight: "bold",
    position: "relative",
    pointerEvents: "none",
    "&:after": {
      content: "''",
      position: "absolute",
      left: 16,
      bottom: 0,
      borderBottom: "1px solid black",
      width: 32,
    },
  },
  menuItem: {
    width: "100%",
  },
  menuItemMessage: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    borderRadius: "35%",
    backgroundColor: grey[200],
    padding: 4,
    cursor: "pointer",
  },
  avatar: {
    height: 30,
    width: 30,
  },
  badge: {
    right: "-4px",
    top: "4px",
  },
}));

export default function Navigation() {
  const authClasses = useAuthStyles();
  const classes = useStyles();
  const authenticated = useAuthContext().authState.authenticated;
  const [open, setOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
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

  const menuItems = (
    <div>
      {menuDropDown(data).map(
        ({ name, title, notificationCount, route, target }) => {
          if (title)
            return (
              <MenuItem classes={{ root: classes.menuTitle }}>{name}</MenuItem>
            );

          const nameElement = <Typography noWrap>{name}</Typography>;
          const hasNotification =
            notificationCount !== undefined && notificationCount > 0;

          return (
            <MenuItem key={name}>
              <a
                href={route}
                target={target || "_self"}
                className={`${classes.menuItem} ${
                  hasNotification && classes.menuItemMessage
                }`}
              >
                {hasNotification ? (
                  <Badge
                    color="primary"
                    variant="dot"
                    classes={{ badge: classes.badge }}
                  >
                    {nameElement}
                  </Badge>
                ) : (
                  nameElement
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
              </a>
            </MenuItem>
          );
        }
      )}
    </div>
  );

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuOpen = () => {
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
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
          <div ref={menuRef} style={{ display: "flex", flexDirection: "row" }}>
            <div
              style={{ marginRight: 16, display: "flex", alignItems: "center" }}
            >
              <ReportButton />
            </div>
            <div
              className={classes.menuBtn}
              onClick={menuOpen ? handleMenuClose : handleMenuOpen}
            >
              <MenuIcon />
              <Avatar src={user?.avatarUrl} className={classes.avatar}>
                {user?.avatarUrl && user.avatarUrl?.length > 0
                  ? null
                  : acronym(user?.name)}
              </Avatar>
            </div>
          </div>

          <Menu
            open={menuOpen}
            anchorEl={menuRef.current}
            elevation={0}
            onClose={handleMenuClose}
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
