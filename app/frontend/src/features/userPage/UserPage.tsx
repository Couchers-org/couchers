import { Grid } from "@material-ui/core";
import React from "react";
import { useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import useUserByUsername from "../userQueries/useUserByUsername";
import UserAbout from "./UserAbout";
import UserGuestbook from "./UserGuestbook";
import UserHeader from "./UserHeader";
import UserPlace from "./UserPlace";
import UserSection from "./UserSection";
import UserSummary from "./UserSummary";

export default function UserPage() {
  const { username } = useParams<{ username: string }>();
  const { data: user, isLoading, isError, error } = useUserByUsername(
    username,
    true
  );

  return (
    <>
      {isError && <Alert severity="error">{error}</Alert>}

      {isLoading && <CircularProgress />}

      {user && !isLoading ? (
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
