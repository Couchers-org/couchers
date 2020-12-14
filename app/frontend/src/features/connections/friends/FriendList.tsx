import {
  Box,
  Card,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { unwrapResult } from "@reduxjs/toolkit";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import TextBody from "../../../components/TextBody";
import { useAppDispatch, useTypedSelector } from "../../../store";
import { service } from "../../../service";
import { getUsers, fetchUsers } from "../../userCache";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import useFriendsBaseStyles from "./useFriendsBaseStyles";
import { CloseIcon, EmailIcon } from "../../../components/Icons";

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
  const isMounted = useIsMounted();
  const [errorMessage, setErrorMessage] = useSafeState(isMounted, "");
  const [loading, setLoading] = useSafeState(isMounted, false);
  const [friendIds, setFriendIds] = useSafeState<number[]>(isMounted, []);
  const dispatch = useAppDispatch();
  const users = useTypedSelector(getUsers);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const friendIds = await service.api.listFriends();
        unwrapResult(await dispatch(fetchUsers({ userIds: friendIds })));
        setFriendIds(friendIds);
        setLoading(false);
      } catch (error) {
        setErrorMessage(error.message);
      }
    })();
  }, [dispatch, setFriendIds, setErrorMessage, setLoading]);

  return (
    <Card>
      <Box className={classes.container}>
        <Typography className={baseClasses.header} variant="h2">
          Your friends
        </Typography>
        {loading ? (
          <CircularProgress className={baseClasses.circularProgress} />
        ) : errorMessage ? (
          <Alert className={baseClasses.errorAlert} severity="error">
            {errorMessage}
          </Alert>
        ) : (
          friendIds.map((friendId) => {
            const friend = users[friendId]?.user;
            return (
              <Box className={classes.friendItem} key={friendId}>
                <Link
                  className={classes.friendLink}
                  to={`/user/${friend?.username}`}
                >
                  <Typography variant="h2" component="h3">
                    {friend?.name}
                  </Typography>
                  <TextBody>@{friend?.username}</TextBody>
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
            );
          })
        )}
      </Box>
    </Card>
  );
}

export default FriendList;
