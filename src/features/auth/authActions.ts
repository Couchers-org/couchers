import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCurrentUser,
  getUserByUsername,
  passwordLogin as apiPasswordLogin,
  tokenLogin as apiTokenLogin,
} from "../../libs/user";

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
