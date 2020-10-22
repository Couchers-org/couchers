import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  completeSignup,
  getCurrentUser,
  getUserByUsername,
  updateUser as apiUpdateUser,
  passwordLogin as apiPasswordLogin,
  SignupArguments,
  tokenLogin as apiTokenLogin,
} from "../../libs/user";
import { HostingStatus, User } from "../../pb/api_pb";
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

export const signup = createAsyncThunk(
  "auth/signup",
  async (signupArguments: SignupArguments) => {
    const token = await completeSignup(signupArguments);

    const user = await getCurrentUser(token);

    return { token, user };
  }
);
