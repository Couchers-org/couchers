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
    const auth = await apiPasswordLogin(username, password);

    const user = auth.jailed ? null : await getUser(username, auth.token);

    return { token: auth.token, jailed: auth.jailed, user };
  }
);

export const tokenLogin = createAsyncThunk(
  "auth/tokenLogin",
  async (loginToken: string) => {
    const auth = await apiTokenLogin(loginToken);

    const user = auth.jailed ? null : await getCurrentUser(auth.token);

    return { token: auth.token, jailed: auth.jailed, user };
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (signupArguments: SignupArguments) => {
    const auth = await completeSignup(signupArguments);

    const user = auth.jailed ? null : await getCurrentUser(auth.token);

    return { token: auth.token, jailed: auth.jailed, user };
  }
);
