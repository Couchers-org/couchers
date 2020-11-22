import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../pb/api_pb";
import { passwordLogin, tokenLogin, signup } from "./index";
import { updateUserProfile, updateHostingPreference } from "../profile";

export interface AuthState {
  authToken: null | string;
  user: null | User.AsObject;
  loading: boolean;
  error?: string | null;
}

const initialState: AuthState = {
  authToken: null,
  user: null,
  //it isn't good practice to keep ui state in the store
  //these refer to authentication loading and error in general
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    authError(state, action: PayloadAction<string>) {
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
  extraReducers: (builder) => {
    builder
      .addCase(passwordLogin.pending, (state) => {
        state.authToken = null;
        state.user = null;
        state.error = null;
        state.loading = true;
      })
      .addCase(passwordLogin.fulfilled, (state, action) => {
        state.authToken = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(passwordLogin.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(tokenLogin.pending, (state) => {
        state.authToken = null;
        state.user = null;
        state.error = null;
        state.loading = true;
      })
      .addCase(tokenLogin.fulfilled, (state, action) => {
        state.authToken = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(tokenLogin.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(signup.pending, (state) => {
        state.authToken = null;
        state.user = null;
        state.error = null;
        state.loading = true;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.authToken = action.payload.token;
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(signup.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateHostingPreference.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, authError, logout } = authSlice.actions;
export default authSlice.reducer;
