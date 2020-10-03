import { createAsyncThunk } from "@reduxjs/toolkit";
import { GetUserReq } from "../../pb/api_pb";
import { AuthReq } from "../../pb/auth_pb";
import { authClient, client } from "../api";

export const passwordLogin = createAsyncThunk(
  "auth/passwordLogin",
  async ({ username, password }: { username: string; password: string }) => {
    const req = new AuthReq();
    req.setUser(username);
    req.setPassword(password);
    const userReq = new GetUserReq();
    userReq.setUser(username);

    const res = await authClient.authenticate(req);
    const token = res.getToken();
    const userRes = await client.getUser(userReq);
    const user = userRes.toObject();

    return { token: token, user: user };
  }
);
