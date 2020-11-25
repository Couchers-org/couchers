import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";
import { SignupArguments } from "../../service/user";

export const passwordLogin = createAsyncThunk(
  "auth/passwordLogin",
  async ({ username, password }: { username: string; password: string }) => {
    const auth = await service.user.passwordLogin(username, password);

    const user = await service.user.getUser(username, auth.token);

    return { token: auth.token, jailed: auth.jailed, user };
  }
);

export const tokenLogin = createAsyncThunk(
  "auth/tokenLogin",
  async (loginToken: string) => {
    const auth = await service.user.tokenLogin(loginToken);

    const user = await service.user.getCurrentUser(auth.token);

    return { token: auth.token, jailed: auth.jailed, user };
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (signupArguments: SignupArguments) => {
    const auth = await service.user.completeSignup(signupArguments);

    const user = await service.user.getCurrentUser(auth.token);

    return { token: auth.token, jailed: auth.jailed, user };
  }
);
