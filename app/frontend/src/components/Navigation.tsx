import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Collapse,
  Hidden,
  makeStyles,
} from "@material-ui/core";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  profileRoute,
  messagesRoute,
  requestsRoute,
  logoutRoute,
} from "../AppRoutes";
import { useTypedSelector } from "../store";
import classNames from "classnames";
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
    top: 'auto',
    bottom: 0,
    [theme.breakpoints.up("md")]: {
      top: 0,
      bottom: 'auto'
    },
  },
}));

export default function Navigation() {
  const classes = useStyles();

  const user = useTypedSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <AppBar 
      position="fixed" 
      color="primary" 
      className={classes.appBar}
    >
      <BottomNavigation
        showLabels
        component='nav'
      >
        {menu.map(item => (
          <BottomNavigationAction
            component={Link}
            to={item.route}
            label={item.name}
          />
        ))}
      </BottomNavigation>
    </AppBar>
  );
}