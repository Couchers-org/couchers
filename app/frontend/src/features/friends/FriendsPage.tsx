import { Grid } from "@material-ui/core";
import React from "react";
import PageTitle from "../../components/PageTitle";
import FriendList from "./FriendList";
import FriendRequests from "./FriendRequests";
import FriendRequestsSent from "./FriendRequestsSent";

function FriendsPage() {
  return (
    <>
      <PageTitle>Friends</PageTitle>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FriendList />
        </Grid>
        <Grid item xs={12} md={6}>
          <FriendRequests />
        </Grid>
        <Grid item xs={12} md={6}>
          <FriendRequestsSent />
        </Grid>
      </Grid>
    </>
  );
}

export default FriendsPage;
