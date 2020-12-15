import {
  Box,
  Card,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React from "react";
import { Link } from "react-router-dom";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import TextBody from "../../../components/TextBody";
import useFriendsBaseStyles from "./useFriendsBaseStyles";
import { CloseIcon, EmailIcon } from "../../../components/Icons";
import useFriendList from "./useFriendList";

const useStyles = makeStyles((theme) => ({
  actionButton: {
    borderRadius: "100%",
    minWidth: "auto",
    height: theme.spacing(3),
    width: theme.spacing(3),
    padding: 0,
  },
  container: {
    "& > :last-child": {
      marginBottom: theme.spacing(1),
    },
  },
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
}));

function FriendList() {
  const baseClasses = useFriendsBaseStyles();
  const classes = useStyles();
  const { errors, isLoading, isError, friendQueries } = useFriendList();

  return (
    <Card>
      <Box className={classes.container}>
        <Typography className={baseClasses.header} variant="h2">
          Your friends
        </Typography>
        {isLoading ? (
          <CircularProgress className={baseClasses.circularProgress} />
        ) : isError ? (
          <Alert className={baseClasses.errorAlert} severity="error">
            {errors.join("\n")}
          </Alert>
        ) : (
          friendQueries.map(({ data: user }) =>
            user ? (
              <Box className={classes.friendItem} key={user.userId}>
                <Link
                  className={classes.friendLink}
                  to={`/user/${user.username}`}
                >
                  <Typography variant="h2" component="h3">
                    {user.name}
                  </Typography>
                  <TextBody>@{user.username}</TextBody>
                </Link>
                <Box>
                  <IconButton aria-label="Direct message">
                    <EmailIcon />
                  </IconButton>
                  <IconButton aria-label="Unfriend">
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : null
          )
        )}
      </Box>
    </Card>
  );
}

export default FriendList;
