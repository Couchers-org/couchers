import { Button, Card, CircularProgress, Grid } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import Alert from "components/Alert";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import {
  ACCOUNT_SETTINGS,
  EDIT_PROFILE,
  SECTION_LABELS,
  SECTION_LABELS_A11Y_TEXT,
} from "features/constants";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
// import References from "features/profile/view/References";
import useCurrentUser from "features/userQueries/useCurrentUser";
import useUserByUsername from "features/userQueries/useUserByUsername";
import React from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { EditUserTab, routeToUser, settingsRoute } from "routes";
import makeStyles from "utils/makeStyles";

import EditHostingPreference from "./EditHostingPreference";
import EditProfile from "./EditProfile";

const useStyles = makeStyles((theme) => ({
  detailsCard: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
    flexGrow: 1,
    marginRight: 0,
    padding: theme.spacing(2),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(1),
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
    paddingTop: theme.spacing(3),
    [theme.breakpoints.up("md")]: {
      paddingTop: 0,
      display: "flex",
    },
  },
  tabPanel: {
    padding: 0,
  },
}));

export default function EditProfilePage() {
  const classes = useStyles();
  const { tab = "about" } = useParams<{ tab: EditUserTab }>();
  const history = useHistory();

  const { username } = useParams<{
    username?: string;
  }>();

  const currentUser = useCurrentUser();
  const { data: user, isLoading: loading, error } = useUserByUsername(
    username ?? (currentUser.data?.username || ""),
    true
  );

  return (
    <>
      <Grid
        container
        direction="row"
        justify="space-between"
        alignItems="center"
      >
        <PageTitle>{EDIT_PROFILE}</PageTitle>
        <div className={classes.buttonContainer}>
          <Button
            component={Link}
            to={settingsRoute}
            variant="contained"
            color="primary"
          >
            {ACCOUNT_SETTINGS}
          </Button>
        </div>
      </Grid>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <div className={classes.root}>
            <Card className={classes.detailsCard}>
              <TabContext value={tab}>
                <TabBar
                  value={tab}
                  setValue={(newTab) =>
                    history.push(
                      routeToUser({
                        tab: newTab,
                        edit: true,
                      })
                    )
                  }
                  labels={{
                    about: SECTION_LABELS.about,
                    home: SECTION_LABELS.home,
                  }}
                  ariaLabel={SECTION_LABELS_A11Y_TEXT}
                />
                <TabPanel classes={{ root: classes.tabPanel }} value="about">
                  <EditProfile />
                </TabPanel>
                <TabPanel value="home">
                  <EditHostingPreference />
                </TabPanel>
              </TabContext>
            </Card>
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
