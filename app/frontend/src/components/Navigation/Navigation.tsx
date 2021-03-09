import {
  AppBar,
  Drawer,
  Grid,
  Hidden,
  IconButton,
  List,
  ListItem,
  makeStyles,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { CloseIcon, MenuIcon } from "components/Icons";
import { useAuthContext } from "features/auth/AuthProvider";
import BugReport from "features/BugReport";
import SearchBox from "features/search/SearchBox";
import React from "react";
import {
  communityRoute,
  eventRoute,
  logoutRoute,
  messagesRoute,
  profileRoute,
} from "routes";

import { COUCHERS, LOG_OUT } from "../../constants";
import NavButton from "./NavButton";

const menu = [
  {
    name: "Dashboard",
    route: "/",
  },
  {
    name: "Events",
    route: eventRoute,
  },
  {
    name: "Messages",
    route: messagesRoute,
  },
  {
    name: "Communities",
    route: communityRoute,
  },
  {
    name: "Profile",
    route: profileRoute,
  },
];

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  appBar: {
    bottom: "auto",
    top: 0,
  },
  flex: {
    [theme.breakpoints.up("md")]: {
      flex: 0,
      justifyContent: "flex-start",
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
      width: "auto",
    },
    flex: 1,
    justifyContent: "space-evenly",
    padding: 0,
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
    fontWeight: "bold",
    paddingLeft: theme.spacing(1),
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
    display: "flex",
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
  const classes = useStyles();
  const authenticated = useAuthContext().authState.authenticated;
  const [open, setOpen] = React.useState(false);

  const logoutButton = <NavButton route={logoutRoute} label={LOG_OUT} />;

  const drawer = (
    <div>
      <List>
        {menu.map(({ name, route }) => (
          <ListItem button key={name}>
            <NavButton route={route} label={name} labelVariant="h2" />
          </ListItem>
        ))}
        <ListItem button key="logout">
          {logoutButton}
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

  if (!authenticated) {
    return null;
  }
  return (
    <AppBar
      position="fixed"
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
              ModalProps={{
                keepMounted: true, // better open performance on mobile
              }}
              classes={{
                paper: classes.drawerPaper,
              }}
            >
              <div className={classes.drawerHeader}>
                <Typography variant="h5" className={classes.drawerTitle}>
                  {COUCHERS}
                </Typography>
                <IconButton
                  className={classes.icon}
                  aria-label="close drawer"
                  onClick={handleDrawerClose}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              {drawer}
            </Drawer>
          </Hidden>
          <Typography variant="h5" className={classes.title}>
            {COUCHERS}
          </Typography>
          <Hidden mdDown>
            <Grid
              container
              wrap="nowrap"
              classes={{
                root: classes.flex,
              }}
            >
              {menu.map((item) => (
                <NavButton
                  route={item.route}
                  label={item.name}
                  key={`${item.name}-nav-button`}
                />
              ))}
            </Grid>
          </Hidden>
        </div>
        <SearchBox />
        <div className={classes.bug}>
          <Hidden smDown>{logoutButton}</Hidden>
          <BugReport />
        </div>
      </Toolbar>
    </AppBar>
  );
}
