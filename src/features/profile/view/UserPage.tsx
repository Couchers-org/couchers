import { CircularProgress, Collapse } from "@material-ui/core";
import Alert from "components/Alert";
import HtmlMeta from "components/HtmlMeta";
import Snackbar from "components/Snackbar";
import { SEND_REQUEST_SUCCESS } from "features/constants";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import NewHostRequest from "features/profile/view/NewHostRequest";
import Overview from "features/profile/view/Overview";
import { useProfileStyles } from "features/profile/view/ProfilePage";
import useUserByUsername from "features/userQueries/useUserByUsername";
import { useLayoutEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { routeToUser } from "routes";

import UserCard from "./UserCard";

const REQUEST_ID = "request";

export default function UserPage() {
  const classes = useProfileStyles();
  const history = useHistory();
  let { username } = useParams<{
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
      <HtmlMeta title={user?.name} />
      {isSuccessRequest && (
        <Snackbar severity="success">{SEND_REQUEST_SUCCESS}</Snackbar>
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
