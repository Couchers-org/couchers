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
import References from "features/profile/view/References";
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
    },
    borderRadius: theme.spacing(1),
    flexGrow: 1,
    padding: theme.spacing(1, 3, 3, 3),
    boxShadow: "1px 1px 8px rgba(0, 0, 0, 0.25)"
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
    padding: theme.spacing(1),
    [theme.breakpoints.up("sm")]: {
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gridGap: theme.spacing(3),
      margin: theme.spacing(0, 3),
      padding: 0,
      paddingTop: theme.spacing(3),
      paddingBottom: theme.spacing(12),
    },
    [theme.breakpoints.up("md")]: {
      gridTemplateColumns: "1fr 3fr",
      maxWidth: "61.5rem",
      margin: "0 auto",
    },
  },
  tabPanel: {
    padding: 0,
    marginTop: theme.spacing(1),
  },
}));

const REQUEST_ID = "request";

export default function ProfilePage() {
  const classes = useStyles();
  const history = useHistory();
  let { tab = "about", username } =
    useParams<{
      tab: UserTab;
      username?: string;
    }>();

  if (
    username === "home" ||
    username === "about" ||
    username === "references"
  ) {
    tab = username;
    username = undefined;
  }

  const currentUser = useCurrentUser();
  const {
    data: user,
    isLoading,
    error,
  } = useUserByUsername(username ?? currentUser.data?.username, true);

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
      {isLoading ? (
        <CircularProgress />
      ) : user ? (
        <ProfileUserProvider user={user}>
          <div className={classes.root}>
            <Overview user={user} setIsRequesting={setIsRequesting} />
            <Card className={classes.detailsCard} id={REQUEST_ID}>
              <TabContext value={tab}>
                <TabBar
                  setValue={(newTab) => {
                    // username will be undefined if we are viewing the current users profile
                    // so no username will be added to the url in that case
                    history.push(routeToUser(username, newTab));
                  }}
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
                  <Home user={user} />
                </TabPanel>
                <TabPanel value="references">
                  <References />
                </TabPanel>
              </TabContext>
            </Card>
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
