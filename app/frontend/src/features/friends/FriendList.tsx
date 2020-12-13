import {
  Box,
  Card,
  CardActionArea,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { unwrapResult } from "@reduxjs/toolkit";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import TextBody from "../../components/TextBody";
import { useAppDispatch, useTypedSelector } from "../../store";
import { service } from "../../service";
import { getUsers, fetchUsers } from "../userCache";
import { useIsMounted, useSafeState } from "../../utils/hooks";

const useStyles = makeStyles((theme) => ({
  circularProgress: {
    display: "block",
    margin: `0 auto ${theme.spacing(1)}`,
  },
  errorAlert: {
    borderRadius: 0,
  },
  friendListContainer: {
    "& > :last-child > $friendItemContent": {
      marginBottom: theme.spacing(1),
    },
  },
  friendItemContent: {
    padding: `0 ${theme.spacing(1)}`,
  },
  friendItem: {
    color: theme.palette.text.primary,
    textDecoration: "none",
  },
  header: {
    marginLeft: theme.spacing(1),
    marginBottom: theme.spacing(2),
    fontWeight: theme.typography.fontWeightBold,
  },
}));

function FriendList() {
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
      <Box className={classes.friendListContainer}>
        <Typography className={classes.header} variant="h2">
          Your friends
        </Typography>
        {loading ? (
          <CircularProgress className={classes.circularProgress} />
        ) : errorMessage ? (
          <Alert className={classes.errorAlert} severity="error">
            {errorMessage}
          </Alert>
        ) : (
          friendIds.map((friendId) => {
            const friend = users[friendId]?.user;
            return (
              <Link
                className={classes.friendItem}
                key={friendId}
                to={`/user/${friend?.username}`}
              >
                <CardActionArea className={classes.friendItemContent}>
                  <Typography variant="h2" component="h3">
                    {friend?.name}
                  </Typography>
                  <TextBody>@{friend?.username}</TextBody>
                </CardActionArea>
              </Link>
            );
          })
        )}
      </Box>
    </Card>
  );
}

export default FriendList;
