import { createAsyncThunk } from "@reduxjs/toolkit";
import { AuthReq } from "../../pb/auth_pb";
import { authClient } from "../api";

export const passwordLogin = createAsyncThunk(
  "auth/passwordLogin",
  async ({ username, password }: { username: string; password: string }) => {
    const req = new AuthReq();
    req.setUser(username);
    req.setPassword(password);

    const res = await authClient.authenticate(req);

    return res.getToken();
  }
);
