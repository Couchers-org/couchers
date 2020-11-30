import { Grid } from "@material-ui/core";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import { useAppDispatch, useTypedSelector } from "../../store";
import { fetchUsers, getUserByUsernameSelector } from "../userCache";
import UserAbout from "./UserAbout";
import UserGuestbook from "./UserGuestbook";
import UserHeader from "./UserHeader";
import UserPlace from "./UserPlace";
import UserSection from "./UserSection";
import UserSummary from "./UserSummary";

export default function UserPage() {
  const dispatch = useAppDispatch();

  const usersLoading = useTypedSelector((state) => state.userCache.loading);
  const usersError = useTypedSelector((state) => state.userCache.error);

  const { username } = useParams<{ username: string }>();
  useEffect(() => {
    dispatch(fetchUsers({ forceInvalidate: true, usernames: [username] }));
  }, [dispatch, username]);

  const getUserByUsername = useTypedSelector((state) =>
    getUserByUsernameSelector(state)
  );
  const user = getUserByUsername(username);

  return (
    <>
      {usersError && <Alert severity="error">{usersError}</Alert>}

      {usersLoading && <CircularProgress />}

      {user && !usersLoading ? (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <UserHeader user={user} />
            <UserSummary user={user} />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <UserSection title="About">
              <UserAbout user={user} />
            </UserSection>
            <UserSection title="My Place">
              <UserPlace user={user} />
            </UserSection>
            <UserSection title="Guestbook">
              <UserGuestbook user={user} />
            </UserSection>
          </Grid>
        </Grid>
      ) : null}
    </>
  );
}
