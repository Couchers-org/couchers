import {
  Collapse,
  Hidden,
  List,
  ListItem,
  ListItemText,
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

const useStyles = makeStyles((theme) => ({
  listContainer: {
    display: "block",
    width: "100%",
    [theme.breakpoints.up("md")]: {
      display: "flex",
      flexWrap: "wrap",
    },
  },
  menuList: {
    [theme.breakpoints.down("sm")]: {
      marginLeft: "1em",
    },
  },
  item: {
    width: "fit-content",
  },
}));

export default function Navigation() {
  const classes = useStyles();

  const user = useTypedSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  const menu = (
    <List className={classNames(classes.listContainer, classes.menuList)}>
      <ListItem button component={Link} to="/" className={classes.item}>
        <ListItemText>Dashboard</ListItemText>
      </ListItem>
      <ListItem
        button
        component={Link}
        to={profileRoute}
        className={classes.item}
      >
        <ListItemText>Profile</ListItemText>
      </ListItem>
      <ListItem
        button
        component={Link}
        to={messagesRoute}
        className={classes.item}
      >
        <ListItemText>Messages</ListItemText>
      </ListItem>
      <ListItem
        button
        component={Link}
        to={requestsRoute}
        className={classes.item}
      >
        <ListItemText>Requests</ListItemText>
      </ListItem>
      {user ? (
        <ListItem
          button
          component={Link}
          to={logoutRoute}
          className={classes.item}
        >
          <ListItemText>Logout</ListItemText>
        </ListItem>
      ) : null}
      <SearchBox />
    </List>
  );

  //this puts the navigation under a collapsable button on mobile only
  return (
    <nav>
      <Hidden mdUp>
        <ListItem
          button
          component="a"
          onClick={handleClick}
          className={classes.item}
        >
          <ListItemText>Navigation</ListItemText>
        </ListItem>
        <Collapse in={open} timeout="auto">
          {menu}
        </Collapse>
      </Hidden>

      <Hidden smDown>{menu}</Hidden>
    </nav>
  );
}
