import { CircularProgress, Collapse } from "@material-ui/core";
import Alert from "components/Alert";
import SuccessSnackbar from "components/SuccessSnackbar";
import { SEND_REQUEST_SUCCESS } from "features/constants";
import NewHostRequest from "features/messages/requests/NewHostRequest";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import Overview from "features/profile/view/Overview";
import UserCard from "features/user/UserCard";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useLayoutEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { routeToUser } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
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
}));

const REQUEST_ID = "request";

export default function UserPage() {
  const classes = useStyles();
  const history = useHistory();
  let { username } =
    useParams<{
      username: string;
    }>();

  const { data: user, isLoading, error } = useUserByUsername(username, true);

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
            <Overview setIsRequesting={setIsRequesting} />
            <UserCard
              onTabChange={(newTab) => {
                history.push(routeToUser(user.username, newTab));
              }}
              top={
                <Collapse in={isRequesting}>
                  <NewHostRequest
                    setIsRequesting={setIsRequesting}
                    setIsRequestSuccess={setIsSuccessRequest}
                  />
                </Collapse>
              }
            />
          </div>
        </ProfileUserProvider>
      ) : null}
    </>
  );
}
