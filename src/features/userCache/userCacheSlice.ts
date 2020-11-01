import {
  createEntityAdapter,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
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
  usernameIds: {} as { [username: string]: number },
  loading: false,
  error: null as string | null | undefined,
};

export type UserCacheState = typeof initialState;

export const userCacheSlice = createSlice({
  name: "userCache",
  initialState: initialState,
  reducers: {
    booksFetched(state, action: PayloadAction<CachedUser[]>) {
      cachedUserAdapter.upsertMany(state, action.payload);
      action.payload.forEach(
        (cachedUser) =>
          (state.usernameIds[cachedUser.user.username] = cachedUser.user.userId)
      );
    },
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
export const getUser = (state: RootState, id: number) =>
  selectors.selectById(state, id)?.user;

const getUsers = selectors.selectEntities;
const getUsernameIds = (state: RootState) => state.userCache.usernameIds;
export const getUserByUsernameSelector = createSelector(
  getUsers,
  getUsernameIds,
  (users, usernameIds) => (username: string) => {
    const id = usernameIds[username];
    return users[id]?.user;
  }
);
