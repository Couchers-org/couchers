import { CircularProgress, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import ErrorAlert from "../../components/ErrorAlert";
import { useAppDispatch, useTypedSelector } from "../../store";
import { fetchUsers, getUserByUsernameSelector } from "../userCache";

export default function UserPage() {
  const dispatch = useAppDispatch();

  const usersLoading = useTypedSelector((state) => state.userCache.loading);
  const usersError = useTypedSelector((state) => state.userCache.error);

  const { username } = useParams<{ username: string }>();
  useEffect(() => {
    dispatch(fetchUsers({ usernames: [username] }));
  }, [dispatch, username]);

  const getUserByUsername = useTypedSelector((state) =>
    getUserByUsernameSelector(state)
  );
  const user = getUserByUsername(username);

  return (
    <>
      <Typography variant="h2" component="h2">
        User
      </Typography>
      {usersError && <ErrorAlert error={usersError} />}

      {usersLoading && <CircularProgress />}

      {user && !usersLoading ? (
        <Typography component="p">
          {user.name} is {user.age} in {user.city}.
        </Typography>
      ) : null}
    </>
  );
}
