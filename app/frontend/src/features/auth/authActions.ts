import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";
import { SignupArguments } from "../../service/user";

const {
  completeSignup,
  getCurrentUser,
  getUser,
  passwordLogin: apiPasswordLogin,
  tokenLogin: apiTokenLogin,
} = service.user;

export const passwordLogin = createAsyncThunk(
  "auth/passwordLogin",
  async ({ username, password }: { username: string; password: string }) => {
    const token = await apiPasswordLogin(username, password);

    const user = await getUser(username, token);

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

export const signup = createAsyncThunk(
  "auth/signup",
  async (signupArguments: SignupArguments) => {
    const token = await completeSignup(signupArguments);

    const user = await getCurrentUser(token);

    return { token, user };
  }
);
