import { Box, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import { Link } from "react-router-dom";
import Alert from "../../../components/Alert";
import TextBody from "../../../components/TextBody";
import { FriendRequest, User } from "../../../pb/api_pb";

const useStyles = makeStyles((theme) => ({
  friendItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `0 ${theme.spacing(1)}`,
  },
  friendLink: {
    color: theme.palette.text.primary,
    textDecoration: "none",
  },
  userLoadErrorAlert: {
    borderRadius: 0,
  },
}));

interface FriendRequestWithUser extends FriendRequest.AsObject {
  friend?: User.AsObject;
}

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friendRequest: FriendRequestWithUser;
}

function FriendSummaryView({
  children,
  friendRequest: { friend, userId },
}: FriendSummaryViewProps) {
  const classes = useStyles();

  return friend ? (
    <Box className={classes.friendItem} key={friend.userId}>
      <Link className={classes.friendLink} to={`/user/${friend.username}`}>
        <Typography variant="h2" component="h3">
          {friend.name}
        </Typography>
        <TextBody>@{friend.username}</TextBody>
      </Link>
      {children}
    </Box>
  ) : (
    <Alert className={classes.userLoadErrorAlert} severity="error">
      Error loading user {userId}
    </Alert>
  );
}

export default FriendSummaryView;
