import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Hidden,
  Typography,
  makeStyles,
} from "@material-ui/core";
import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  profileRoute,
  messagesRoute,
  requestsRoute,
  logoutRoute,
} from "../AppRoutes";
import { useTypedSelector } from "../store";
import SearchBox from "./SearchBox";

const menu = [
  {
    name: "Dashboard",
    route: "/"
  },
  {
    name: "Messages",
    route: messagesRoute
  },
  {
    name: "Requests",
    route: requestsRoute
  },
  {
    name: "Profile",
    route: profileRoute
  },
];

const useStyles = makeStyles((theme) => ({
  appBar: {
    bottom: 'auto',
    top: 0,
    [theme.breakpoints.down("md")]: {
      bottom: 0,
      top: 'auto',
    },
  },
  bottomNav: {
    [theme.breakpoints.up("md")]: {
      alignItems: 'center',
      padding: '.2rem 3rem',
      height: 'auto',
    },
  },
  title: {
    fontWeight: "bold",
  },
  search: {
    flexGrow: 3,
    display: 'flex',
    justifyCotent: 'flex-end',
  }
}));

export default function Navigation() {
  const classes = useStyles();

  const user = useTypedSelector((state) => state.auth.user);

  return (
    <AppBar 
      position="fixed" 
      className={classes.appBar}
    >
      <BottomNavigation
        showLabels
        classes={{root: classes.bottomNav}}
      >
        <Hidden mdDown>
          <Typography 
            variant="h6" 
            className={classes.title}
          >
            Couchers
          </Typography>
        </Hidden>
        {menu.map(item => (
          <BottomNavigationAction
            activeClassName="Mui-selected"
            component={NavLink}
            exact
            label={item.name}
            to={item.route}
          />
        ))}
        <Hidden mdDown>
          { user && (
            <BottomNavigationAction
              component={Link}
              to={logoutRoute}
              label="Logout"
              showLabel
            />
          )}
          <div className={classes.search}>
            <SearchBox />
          </div>
        </Hidden>
      </BottomNavigation>
    </AppBar>
  );
}