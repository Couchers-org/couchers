import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCurrentUser,
  getUserByUsername,
  updateUser as apiUpdateUser,
  passwordLogin as apiPasswordLogin,
  tokenLogin as apiTokenLogin,
} from "../../libs/user";
import { User } from "../../pb/api_pb";
import { RootState } from "../../reducers";

export const passwordLogin = createAsyncThunk(
  "auth/passwordLogin",
  async ({ username, password }: { username: string; password: string }) => {
    const token = await apiPasswordLogin(username, password);

    const user = await getUserByUsername(username, token);

    return { token, user };
  }
);

export const tokenLogin = createAsyncThunk(
  "auth/tokenLogin",
  async (loginToken: string) => {
    const token = await apiTokenLogin(loginToken);

    const user = await getCurrentUser(token);

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

  await apiUpdateUser(user);

  return getUserByUsername(username);
});
