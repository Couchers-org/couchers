import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCurrentUser,
  getUserByUsername,
  passwordLogin as apiPasswordLogin,
  tokenLogin as apiTokenLogin,
} from "../../libs/user";
import { User } from "../../pb/api_pb";
import { RootState } from "../../reducers";
import { setAuthToken } from "../api";

export const passwordLogin = createAsyncThunk(
  "auth/passwordLogin",
  async ({ username, password }: { username: string; password: string }) => {
    const token = await apiPasswordLogin(username, password);
    setAuthToken(token);

    const user = await getUserByUsername(username);

    return { token, user };
  }
);

export const tokenLogin = createAsyncThunk(
  "auth/tokenLogin",
  async (loginToken: string) => {
    const token = await apiTokenLogin(loginToken);
    setAuthToken(token);

    const user = await getCurrentUser();

    return { token, user };
  }
);

export const updateUser = createAsyncThunk<
  User.AsObject,
  User.AsObject,
  { state: RootState }
>("auth/updateUser", async (user, { getState }) => {
  const username = getState().auth.user?.username;

  if (!username) {
    throw Error("User is not connected.");
  }

  await updateUser(user);

  return getUserByUsername(username);
});
