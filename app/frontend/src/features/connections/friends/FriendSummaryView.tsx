import { Box, makeStyles, Typography } from "@material-ui/core";
import TextBody from "components/TextBody";
import { User } from "pb/api_pb";
import React from "react";
import { Link } from "react-router-dom";
import { routeToUser } from "routes";

const useStyles = makeStyles((theme) => ({
  friendItem: {
    alignItems: "center",
    display: "flex",
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

interface FriendSummaryViewProps {
  children?: React.ReactNode;
  friend?: User.AsObject;
}

function FriendSummaryView({ children, friend }: FriendSummaryViewProps) {
  const classes = useStyles();

  return friend ? (
    <Box className={classes.friendItem}>
      <Link className={classes.friendLink} to={routeToUser(friend.username)}>
        <Typography component="h3" variant="h2">
          {friend.name}
        </Typography>
        <TextBody>@{friend.username}</TextBody>
      </Link>
      {children}
    </Box>
  ) : null;
}

export default FriendSummaryView;
