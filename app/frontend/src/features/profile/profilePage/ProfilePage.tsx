import {
  Card,
  CircularProgress,
  List,
  ListItem,
  makeStyles,
} from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";

import Alert from "../../../components/Alert";
import TabBar from "../../../components/TabBar";
import {
  changeEmailRoute,
  changePasswordRoute,
  editHostingPreferenceRoute,
  editProfileRoute,
} from "../../../routes";
import { SECTION_LABELS } from "../../constants";
import useCurrentUser from "../../userQueries/useCurrentUser";
import useUserByUsername from "../../userQueries/useUserByUsername";
import About from "./About";
import Overview from "./Overview";

const useStyles = makeStyles((theme) => ({
  root: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
      justifyContent: "space-around",
    },
  },
  detailsCard: {
    flexGrow: 1,
    margin: theme.spacing(2),
    padding: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
  },
  linkStyle: {
    color: "inherit",
    fontSize: "1rem",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  tabPanel: {
    padding: 0,
  },
}));

export default function ProfilePage() {
  const classes = useStyles();
  const [currentTab, setCurrentTab] = useState<keyof typeof SECTION_LABELS>(
    "about"
  );

  const { username } = useParams<{
    username?: string;
  }>();

  const currentUser = useCurrentUser();
  const { data: user, isLoading: loading, error } = useUserByUsername(
    username ?? (currentUser.data?.username || "")
  );

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : user ? (
        <div className={classes.root}>
          <Overview {...{ user }} />
          <Card className={classes.detailsCard}>
            <TabContext value={currentTab}>
              <TabBar
                value={currentTab}
                setValue={setCurrentTab}
                labels={SECTION_LABELS}
                aria-label="tabs for user's details"
              />
              <TabPanel classes={{ root: classes.tabPanel }} value="about">
                <About {...{ user }} />
              </TabPanel>
              <TabPanel value="home">
                <div>home</div>
              </TabPanel>
              <TabPanel value="references">
                <div>references</div>
              </TabPanel>
              <TabPanel value="favorites">
                <div>favorites</div>
              </TabPanel>
              <TabPanel value="photos">
                <div>photos</div>
              </TabPanel>
            </TabContext>
          </Card>
        </div>
      ) : (
        <></>
      )}
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
