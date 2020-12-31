import { combineReducers } from "@reduxjs/toolkit";
import { groupChats } from "./features/messages/groupchats";
import hostRequests from "./features/messages/surfing/hostRequestsSlice";

const rootReducer = combineReducers({
  hostRequests,
  groupChats,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
