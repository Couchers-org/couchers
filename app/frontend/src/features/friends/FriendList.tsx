import {
  Box,
  Card,
  CardActionArea,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import TextBody from "../../components/TextBody";
import { useAppDispatch, useTypedSelector } from "../../store";
import { service } from "../../service";
import { getUsers, fetchUsers } from "../userCache";
import { useIsMounted, useSafeState } from "../../utils/hooks";

const useStyles = makeStyles((theme) => ({
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
  const [friendIds, setFriendIds] = useSafeState<number[]>(isMounted, []);
  const dispatch = useAppDispatch();
  const users = useTypedSelector(getUsers);

  useEffect(() => {
    (async () => {
      const friendIds = await service.api.listFriends();
      await dispatch(fetchUsers({ userIds: friendIds }));
      setFriendIds(friendIds);
    })();
  }, [dispatch, setFriendIds]);

  return (
    <Card>
      <Box className={classes.friendListContainer}>
        <Typography className={classes.header} variant="h2">
          Your friends
        </Typography>
        {friendIds.map((friendId) => {
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
        })}
      </Box>
    </Card>
  );
}

export default FriendList;
