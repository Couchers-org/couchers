import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUser } from "../../libs/user";
import { RootState } from "../../reducers";
import { usersFetched, CachedUser } from "./index";
import { hasUserExpired } from "./utils";

type FetchUsersArguments = {
  userIds?: number[];
  usernames?: string[];
  forceInvalidate?: boolean;
};

export const fetchUsers = createAsyncThunk<
  void,
  FetchUsersArguments,
  { state: RootState }
>(
  "userCache/fetchUsers",
  async (
    { userIds, usernames, forceInvalidate }: FetchUsersArguments,
    thunkApi
  ) => {
    const cachedUsers = [] as CachedUser[];
    const userIdFetches =
      userIds?.map(async (userId) => {
        const exists = thunkApi.getState().userCache.ids.includes(userId);
        const expired = hasUserExpired(userId, thunkApi.getState());
        if (!exists || expired || forceInvalidate) {
          cachedUsers.push({
            fetched: new Date(),
            user: await getUser(userId.toString()),
          });
        }
      }) || [];
    const usernameFetches =
      usernames?.map(async (username) => {
        const usernameIds = thunkApi.getState().userCache.usernameIds;
        const exists = Object.keys(usernameIds).includes(username);
        const expired = hasUserExpired(
          usernameIds[username],
          thunkApi.getState()
        );
        if (!exists || expired || forceInvalidate) {
          cachedUsers.push({
            fetched: new Date(),
            user: await getUser(username),
          });
        }
      }) || [];
    await Promise.all([...userIdFetches, ...usernameFetches]);
    if (cachedUsers.length) {
      thunkApi.dispatch(usersFetched(cachedUsers));
    }
  }
);
