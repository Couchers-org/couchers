import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  HostingPreferenceData,
  UpdateUserProfileData,
  service,
} from "../../service";
import { User } from "../../pb/api_pb";
import { RootState } from "../../reducers";

export const updateUserProfile = createAsyncThunk<
  User.AsObject,
  UpdateUserProfileData,
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
  HostingPreferenceData,
  { state: RootState }
>("profile/updateHostingPreference", async (preferences, { getState }) => {
  const username = getState().auth.user?.username;

  if (!username) {
    throw Error("User is not connected.");
  }

  await service.user.updateHostingPreference(preferences);

  return service.user.getUser(username);
});
