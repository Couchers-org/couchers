import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../pb/api_pb";
import { passwordLogin } from "./authActions";

const initialState = {
  authToken: null as null | string,
  error: null as string | null | undefined,
  user: null as null | User,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    tokenSuccess(state, action: PayloadAction<string>) {
      state.authToken = action.payload;
    },
    userSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(passwordLogin.pending, (state) => {
        state.authToken = null;
        state.user = null;
        state.error = null;
      })
      .addCase(passwordLogin.fulfilled, (state, action) => {
        state.authToken = action.payload;
      })
      .addCase(passwordLogin.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { tokenSuccess, userSuccess } = authSlice.actions;

export default authSlice.reducer;
