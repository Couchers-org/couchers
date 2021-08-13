import {
  AppBar,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  Toolbar,
} from "@material-ui/core";
import classNames from "classnames";
import { CloseIcon, MenuIcon } from "components/Icons";
import ExternalNavButton from "components/Navigation/ExternalNavButton";
import { useAuthContext } from "features/auth/AuthProvider";
import useAuthStyles from "features/auth/useAuthStyles";
import ReportButton from "features/ReportButton";
import useNotifications from "features/useNotifications";
import React from "react";
import CouchersLogo from "resources/CouchersLogo";
import {
  contributeRoute,
  couchersURL,
  donationsRoute,
  forumURL,
  logoutRoute,
  messagesRoute,
  routeToProfile,
  searchRoute,
} from "routes";
import makeStyles from "utils/makeStyles";

import {
  ABOUT,
  COUCHERS,
  DASHBOARD,
  DONATE,
  FORUM,
  LOG_OUT,
  MAP_SEARCH,
  MESSAGES,
  PROFILE,
  VOLUNTEER,
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
    justifyContent: "flex-end",
    [theme.breakpoints.down("md")]: {
      paddingRight: theme.spacing(2),
    },
  },
  title: {
    alignSelf: "center",
    fontWeight: "bold",
  },
}));

export default function Navigation() {
  const authClasses = useAuthStyles();
  const classes = useStyles();
  const authenticated = useAuthContext().authState.authenticated;
  const [open, setOpen] = React.useState(false);
  const { data } = useNotifications();

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
        <ListItem button key="about">
          <ExternalNavButton
            route={couchersURL}
            label={ABOUT}
            labelVariant="h2"
          />
        </ListItem>
        <ListItem button key="forum">
          <ExternalNavButton route={forumURL} label={FORUM} labelVariant="h2" />
        </ListItem>
        <ListItem button key="contribute">
          <NavButton
            route={contributeRoute}
            label={VOLUNTEER}
            labelVariant="h2"
          />
        </ListItem>
        <ListItem button key="donate">
          <NavButton route={donationsRoute} label={DONATE} labelVariant="h2" />
        </ListItem>
        <ListItem button key="logout">
          <NavButton route={logoutRoute} label={LOG_OUT} labelVariant="h2" />
        </ListItem>
      </List>
    </div>
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
          {/* Put this back when right links are in a footer
          <Hidden smDown>
            <div className={classNames(authClasses.logo, classes.logoText)}>
              {COUCHERS}
            </div>
          </Hidden> */}
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
        <div className={classes.bug}>
          <Hidden smDown>
            <ExternalNavButton
              route={couchersURL}
              label={ABOUT}
              labelVariant="h3"
            />
            <ExternalNavButton
              route={forumURL}
              label={FORUM}
              labelVariant="h3"
            />
            <NavButton
              route={contributeRoute}
              label={VOLUNTEER}
              labelVariant="h3"
            />
            <NavButton
              route={donationsRoute}
              label={DONATE}
              labelVariant="h3"
            />
            <NavButton route={logoutRoute} label={LOG_OUT} />
          </Hidden>
          <ReportButton />
        </div>
      </Toolbar>
    </AppBar>
  );
}
