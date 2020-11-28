import { makeStyles, List, ListItem } from "@material-ui/core";
import { Link } from "react-router-dom";
import React from "react";

import { editHostingPreferenceRoute, editProfileRoute } from "../../AppRoutes";
import PageTitle from "../../components/PageTitle";

const useStyles = makeStyles({
  linkStyle: {
    color: "inherit",
    fontSize: "1rem",
    textDecoration: "none",
  },
});

export default function ProfilePage() {
  const classes = useStyles();

  return (
    <>
      <PageTitle>Profile</PageTitle>
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
      </List>
    </>
  );
}
