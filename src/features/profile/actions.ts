import { createAsyncThunk } from "@reduxjs/toolkit";
import { ProfileFormData } from "./index";
import { getUser, updateProfile } from "../../libs/user";
import { User } from "../../pb/api_pb";
import { RootState } from "../../reducers";

export const updateUserProfile = createAsyncThunk<
  User.AsObject,
  ProfileFormData,
  { state: RootState }
>("profile/updateUserProfile", async (userData, { getState }) => {
  const username = getState().auth.user?.username;

  if (!username) {
    throw Error("User is not connected.");
  }

  await updateProfile(userData);

  return getUser(username);
});
