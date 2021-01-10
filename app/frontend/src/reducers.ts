import { combineReducers } from "@reduxjs/toolkit";
import { groupChats } from "./features/messages/groupchats";

const rootReducer = combineReducers({
  groupChats,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
