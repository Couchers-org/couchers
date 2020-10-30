import {
  Collapse,
  Hidden,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  TextField,
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
  const styles = useStyles();

  const user = useTypedSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(!open);
  };

  const menu = (
    <List className={`${styles.listContainer} ${styles.menuList}`}>
      <ListItem button component={Link} to="/" className={styles.item}>
        <ListItemText>Dashboard</ListItemText>
      </ListItem>
      <ListItem
        button
        component={Link}
        to={profileRoute}
        className={styles.item}
      >
        <ListItemText>Profile</ListItemText>
      </ListItem>
      <ListItem
        button
        component={Link}
        to={messagesRoute}
        className={styles.item}
      >
        <ListItemText>Messages</ListItemText>
      </ListItem>
      <ListItem
        button
        component={Link}
        to={requestsRoute}
        className={styles.item}
      >
        <ListItemText>Requests</ListItemText>
      </ListItem>
      {user ? (
        <ListItem
          button
          component={Link}
          to={logoutRoute}
          className={styles.item}
        >
          <ListItemText>Logout</ListItemText>
        </ListItem>
      ) : null}
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
          className={styles.item}
        >
          <ListItemText>Navigation</ListItemText>
        </ListItem>
        <Collapse in={open} timeout="auto">
          {menu}
        </Collapse>
      </Hidden>

      <Hidden smDown>{menu}</Hidden>

      <TextField variant="filled" label="Search"></TextField>
    </nav>
  );
}
