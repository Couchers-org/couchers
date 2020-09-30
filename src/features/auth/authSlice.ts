import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../pb/api_pb";
import { AuthReq } from "../../pb/auth_pb";
import { AppThunk } from "../../store";
import { authClient } from "../api";

const initialState = {
  authToken: null as null | string,
  user: null as null | User,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    tokenSuccess(state, action: PayloadAction<string>) {
      state.authToken = action.payload;
    },
    userSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
    }
  }
});

export const { tokenSuccess, userSuccess } = authSlice.actions;
export default authSlice.reducer;

export const passwordLogin = (
  username: string,
  password: string,
): AppThunk => async dispatch => {
  const req = new AuthReq();
  req.setUser(username);
  req.setPassword(password);
  try {
    const res = await authClient.authenticate(req);
    dispatch(tokenSuccess(res.getToken()));
    console.log(res.getToken());
  } catch (e) {
    alert(`Error: ${e}`);
    return;
  }
}
