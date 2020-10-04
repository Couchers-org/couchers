import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { authToken, setAuthToken } from "./features/api";
import rootReducer, { RootState } from "./reducers";

const store = configureStore({
  reducer: rootReducer,
});

store.subscribe(() => {
  const newToken = store.getState().auth.authToken;

  if (authToken !== newToken) {
    console.log(`Updating authToken from ${authToken} to ${newToken}.`);
    setAuthToken(newToken);
  }
});

export type AppDispatch = typeof store.dispatch;
export type AppThunk = ThunkAction<void, RootState, null, Action<string>>;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
