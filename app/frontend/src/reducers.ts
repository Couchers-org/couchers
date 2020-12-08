import { combineReducers } from "@reduxjs/toolkit";
import { auth } from "./features/auth";
import hostRequests from "./features/messages/surfing/hostRequestsSlice";
import { userCache } from "./features/userCache";

const rootReducer = combineReducers({
  auth,
  userCache,
  hostRequests,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
