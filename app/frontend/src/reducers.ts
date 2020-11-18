import { combineReducers } from "@reduxjs/toolkit";
import { auth } from "./features/auth";
import { userCache } from "./features/userCache";

const rootReducer = combineReducers({
  auth,
  userCache,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
