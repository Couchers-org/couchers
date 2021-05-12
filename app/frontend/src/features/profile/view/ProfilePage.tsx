import { Card, CircularProgress, Collapse } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import Alert from "components/Alert";
import SuccessSnackbar from "components/SuccessSnackbar";
import TabBar from "components/TabBar";
import {
  SECTION_LABELS,
  SECTION_LABELS_A11Y_TEXT,
  SEND_REQUEST_SUCCESS,
} from "features/constants";
import NewHostRequest from "features/messages/requests/NewHostRequest";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import About from "features/profile/view/About";
import Home from "features/profile/view/Home";
import Overview from "features/profile/view/Overview";
// import References from "features/profile/view/References";
import useCurrentUser from "features/userQueries/useCurrentUser";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useLayoutEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { routeToUser, UserTab } from "routes";
import makeStyles from "utils/makeStyles";

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
    paddingTop: theme.spacing(3),
    [theme.breakpoints.up("md")]: {
      display: "flex",
      maxWidth: theme.breakpoints.values.lg,
      margin: "0 auto",
      paddingTop: 0,
    },
  },
  tabPanel: {
    padding: 0,
  },
}));

const REQUEST_ID = "request";

export default function ProfilePage() {
  const classes = useStyles();
  const history = useHistory();
  const { tab = "about" } = useParams<{ tab: UserTab }>();
  const { username } = useParams<{
    username?: string;
  }>();

  const currentUser = useCurrentUser();
  const { data: user, isLoading: loading, error } = useUserByUsername(
    username ?? (currentUser.data?.username || ""),
    true
  );

  const [isRequesting, setIsRequesting] = useState(false);
  const [isSuccessRequest, setIsSuccessRequest] = useState(false);

  useLayoutEffect(() => {
    if (isRequesting) {
      const requestEl = document.getElementById(REQUEST_ID);
      requestEl?.scrollIntoView();
    }
  }, [isRequesting]);

  return (
    <>
      {isSuccessRequest && (
        <SuccessSnackbar>{SEND_REQUEST_SUCCESS}</SuccessSnackbar>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <div className={classes.root}>
            <Overview user={user} setIsRequesting={setIsRequesting} />
            <Card className={classes.detailsCard} id={REQUEST_ID}>
              <TabContext value={tab}>
                <TabBar
                  value={tab}
                  setValue={(newTab) =>
                    history.push(
                      routeToUser({
                        username: user.username,
                        tab: newTab,
                      })
                    )
                  }
                  labels={SECTION_LABELS}
                  ariaLabel={SECTION_LABELS_A11Y_TEXT}
                />
                <Collapse in={isRequesting}>
                  <NewHostRequest
                    user={user}
                    setIsRequesting={setIsRequesting}
                    setIsRequestSuccess={setIsSuccessRequest}
                  />
                </Collapse>
                <TabPanel classes={{ root: classes.tabPanel }} value="about">
                  <About user={user} />
                </TabPanel>
                <TabPanel value="home">
                  <Home user={user}></Home>
                </TabPanel>
              </TabContext>
            </Card>
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
