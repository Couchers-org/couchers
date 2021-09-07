import { Grid } from "@material-ui/core";
import makeStyles from "utils/makeStyles";

import FriendList from "./FriendList";
import FriendRequestsReceived from "./FriendRequestsReceived";
import FriendRequestsSent from "./FriendRequestsSent";

export const useStyles = makeStyles(() => ({
  gridItem: {
    "& > div": {
      height: "100%",
    },
  },
}));

function FriendsTab() {
  const classes = useStyles();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6} className={classes.gridItem}>
        <FriendRequestsReceived />
      </Grid>
      <Grid item xs={12} md={6} className={classes.gridItem}>
        <FriendList />
      </Grid>
      <Grid item xs={12} md={6} className={classes.gridItem}>
        <FriendRequestsSent />
      </Grid>
    </Grid>
  );
}

export default FriendsTab;
