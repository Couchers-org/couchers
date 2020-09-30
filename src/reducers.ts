import { combineReducers } from "@reduxjs/toolkit";
import auth from "./features/auth/authSlice";

const rootReducer = combineReducers({
    auth,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
