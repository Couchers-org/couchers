import { createAsyncThunk } from "@reduxjs/toolkit";
import { getUser } from "../../libs/user";
import { RootState } from "../../reducers";
import { booksFetched, CachedUser } from "./index";

const expiryMilliseconds = 1000 * 60 * 5;

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
    await Promise.all([
      ...(userIds?.map(async (userId) => {
        const exists = thunkApi.getState().userCache.ids.includes(userId);
        const expired =
          new Date().getTime() -
            (thunkApi.getState().userCache.entities[userId]?.date || 0) >
          expiryMilliseconds;
        if (!exists || expired || forceInvalidate) {
          cachedUsers.push({
            date: new Date().getTime(),
            user: await getUser(userId.toString()),
          });
        }
      }) || []),

      ...(usernames?.map(async (username) => {
        const usernameIds = thunkApi.getState().userCache.usernameIds;
        const exists = Object.keys(usernameIds).includes(username);
        const expired =
          new Date().getTime() -
            (thunkApi.getState().userCache.entities[usernameIds[username]]
              ?.date || 0) >
          expiryMilliseconds;
        if (!exists || expired || forceInvalidate) {
          cachedUsers.push({
            date: new Date().getTime(),
            user: await getUser(username),
          });
        }
      }) || []),
    ]);
    if (cachedUsers.length > 0) {
      thunkApi.dispatch(booksFetched(cachedUsers));
    }
  }
);
