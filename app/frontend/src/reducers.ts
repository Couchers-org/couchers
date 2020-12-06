import { combineReducers } from "@reduxjs/toolkit";
import { auth } from "./features/auth";
import { userCache } from "./features/userCache";
import { default as hostRequests } from "./features/messages/surfing/hostRequestsSlice";

const rootReducer = combineReducers({
  auth,
  userCache,
  hostRequests,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
