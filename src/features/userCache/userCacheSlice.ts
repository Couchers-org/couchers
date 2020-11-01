import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { User } from "../../pb/api_pb";
import { RootState } from "../../reducers";
import { fetchUsers } from "./index";

export type CachedUser = {
  date: number;
  user: User.AsObject;
};

export const cachedUserAdapter = createEntityAdapter<CachedUser>({
  selectId: (cachedUser) => cachedUser.user.userId,
});

const initialState = {
  ...cachedUserAdapter.getInitialState(),
  loading: false,
  error: null as string | null | undefined,
};

export type UserCacheState = typeof initialState;

export const userCacheSlice = createSlice({
  name: "userCache",
  initialState: initialState,
  reducers: {
    booksFetched: cachedUserAdapter.upsertMany,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.error = null;
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});

export const { booksFetched } = userCacheSlice.actions;
export default userCacheSlice.reducer;

const selectors = cachedUserAdapter.getSelectors<RootState>(
  (state) => state.userCache
);
export const getUser = selectors.selectById;
