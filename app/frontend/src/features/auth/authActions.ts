import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";
import { SignupArguments } from "../../service/user";

export const passwordLogin = createAsyncThunk(
  "auth/passwordLogin",
  async ({ username, password }: { username: string; password: string }) => {
    const token = await service.user.passwordLogin(username, password);

    const user = await service.user.getUser(username, token);

    return { token, user };
  }
);

export const tokenLogin = createAsyncThunk(
  "auth/tokenLogin",
  async (loginToken: string) => {
    const token = await service.user.tokenLogin(loginToken);

    const user = await service.user.getCurrentUser(token);

    return { token, user };
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (signupArguments: SignupArguments) => {
    const token = await service.user.completeSignup(signupArguments);

    const user = await service.user.getCurrentUser(token);

    return { token, user };
  }
);
