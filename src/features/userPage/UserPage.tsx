import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Alert from "../../components/Alert";
import CircularProgress from "../../components/CircularProgress";
import H2 from "../../components/H2";
import TextBody from "../../components/TextBody";
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
      <H2>User</H2>
      {usersError && <Alert severity="error">{usersError}</Alert>}

      {usersLoading && <CircularProgress />}

      {user && !usersLoading ? (
        <TextBody>
          {user.name} is {user.age} in {user.city}.
        </TextBody>
      ) : null}
    </>
  );
}
