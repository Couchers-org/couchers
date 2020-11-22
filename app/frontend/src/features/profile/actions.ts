import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";
import { User } from "../../pb/api_pb";
import { RootState } from "../../reducers";
import { ProfileFormData } from "../../service/user";

export const updateUserProfile = createAsyncThunk<
  User.AsObject,
  ProfileFormData,
  { state: RootState }
>("profile/updateUserProfile", async (userData, { getState }) => {
  const username = getState().auth.user?.username;

  if (!username) {
    throw Error("User is not connected.");
  }

  await service.user.updateProfile(userData);

  return service.user.getUser(username);
});

export const updateHostingPreference = createAsyncThunk<
  User.AsObject,
  ProfileFormData,
  { state: RootState }
>("profile/updateHostingPreference", async (userData, { getState }) => {
  const username = getState().auth.user?.username;

  if (!username) {
    throw Error("User is not connected.");
  }

  await service.user.updateHostingPreference(userData);

  return service.user.getUser(username);
});
