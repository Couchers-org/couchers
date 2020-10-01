import { GetUserReq } from "../../pb/api_pb";
import { AuthReq } from "../../pb/auth_pb";
import { AppThunk } from "../../store";
import { authClient, client } from "../api";
import {
  error,
  startLoading,
  finishLoading,
  tokenSuccess,
  userSuccess,
  clearError,
} from "./authSlice";

export const passwordLogin = (
  username: string,
  password: string
): AppThunk => async (dispatch) => {
  dispatch(startLoading());
  dispatch(clearError());
  const req = new AuthReq();
  req.setUser(username);
  req.setPassword(password);
  const userReq = new GetUserReq();
  userReq.setUser(username);
  try {
    const res = await authClient.authenticate(req);
    const token = res.getToken();
    dispatch(tokenSuccess(token));

    const userRes = await client.getUser(userReq);
    const user = userRes.toObject();
    dispatch(userSuccess(user));
  } catch (e) {
    dispatch(error(e.message));
  }
  dispatch(finishLoading());
};
