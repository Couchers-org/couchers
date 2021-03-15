import { Card, CircularProgress, makeStyles } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import Alert from "components/Alert";
import TabBar from "components/TabBar";
import { SECTION_LABELS } from "features/constants";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import Overview from "features/profile/view/Overview";
import References from "features/profile/view/References";
import useCurrentUser from "features/userQueries/useCurrentUser";
import useUserByUsername from "features/userQueries/useUserByUsername";
import React, { useState } from "react";
import { useParams } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  detailsCard: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
    flexGrow: 1,
    margin: theme.spacing(2),
    padding: theme.spacing(2),
  },
  linkStyle: {
    "&:hover": {
      textDecoration: "underline",
    },
    color: "inherit",
    fontSize: "1rem",
    textDecoration: "none",
  },
  root: {
    [theme.breakpoints.up("md")]: {
      display: "flex",
      justifyContent: "space-around",
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
        <ProfileUserProvider user={user}>
          <div className={classes.root}>
            <Overview user={user} />
            <Card className={classes.detailsCard}>
              <TabContext value={currentTab}>
                <TabBar
                  value={currentTab}
                  setValue={setCurrentTab}
                  labels={SECTION_LABELS}
                  aria-label="tabs for user's details"
                />
                <TabPanel classes={{ root: classes.tabPanel }} value="about">
                  <About user={user} />
                </TabPanel>
                <TabPanel value="home">
                  <Home user={user}></Home>
                </TabPanel>
                <TabPanel
                  classes={{ root: classes.tabPanel }}
                  value="references"
                >
                  <References user={user} />
                </TabPanel>
              </TabContext>
            </Card>
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
