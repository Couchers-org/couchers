import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../pb/api_pb";

const initialState = {
  authToken: null as null | string,
  user: null as null | User.AsObject,
  //it isn't good practice to keep ui state in the store
  //these refer to authentication loading and error in general
  loading: false,
  error: null as null | string,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    startLoading(state) {
      state.loading = true;
    },
    finishLoading(state) {
      state.loading = false;
    },
    clearError(state) {
      state.error = null;
    },
    tokenSuccess(state, action: PayloadAction<string>) {
      state.authToken = action.payload;
    },
    userSuccess(state, action: PayloadAction<User.AsObject>) {
      state.user = action.payload;
    },
    error(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.authToken = null;
      state.user = null;
      state.error = null;
      state.loading = false;
    },
  },
});

export const {
  startLoading,
  finishLoading,
  clearError,
  tokenSuccess,
  userSuccess,
  error,
  logout,
} = authSlice.actions;
export default authSlice.reducer;
