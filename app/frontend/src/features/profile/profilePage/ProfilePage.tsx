import { List, ListItem, makeStyles } from "@material-ui/core";
import React from "react";
import { Link } from "react-router-dom";

import {
  changeEmailRoute,
  changePasswordRoute,
  editHostingPreferenceRoute,
  editProfileRoute,
} from "../../../routes";
import useCurrentUser from "../../userQueries/useCurrentUser";
import Overview from "./Overview";

const useStyles = makeStyles({
  linkStyle: {
    color: "inherit",
    fontSize: "1rem",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
});

export default function ProfilePage() {
  const classes = useStyles();
  const { data: user } = useCurrentUser();

  return (
    <>
      {user ? <Overview {...{ user }} /> : <></>}
      <List>
        <ListItem
          className={classes.linkStyle}
          component={Link}
          to={editProfileRoute}
        >
          Edit my profile
        </ListItem>
        <ListItem
          className={classes.linkStyle}
          component={Link}
          to={editHostingPreferenceRoute}
        >
          Edit my place
        </ListItem>
        <ListItem
          className={classes.linkStyle}
          component={Link}
          to={changeEmailRoute}
        >
          Change my email
        </ListItem>
        <ListItem
          className={classes.linkStyle}
          component={Link}
          to={changePasswordRoute}
        >
          Change my password
        </ListItem>
      </List>
    </>
  );
}
