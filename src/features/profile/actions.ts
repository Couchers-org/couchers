import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getUserByUsername,
  updateUser as apiUpdateUser,
} from "../../libs/user";
import { User } from "../../pb/api_pb";
import { RootState } from "../../reducers";

export const updateUser = createAsyncThunk<
  User.AsObject,
  User.AsObject,
  { state: RootState }
>("profile/updateUser", async (user, { getState }) => {
  const username = getState().auth.user?.username;

  if (!username) {
    throw Error("User is not connected.");
  }

  await apiUpdateUser(user);

  return getUserByUsername(username);
});
