import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HostRequest } from "../../../pb/requests_pb";

const initialState = {
  hostRequests: [] as HostRequest.AsObject[],
};

export type RequestsState = typeof initialState;

export const hostRequestsSlice = createSlice({
  name: "hostRequests",
  initialState,
  reducers: {
    hostRequestsFetched(state, action: PayloadAction<HostRequest.AsObject[]>) {
      state.hostRequests = action.payload;
    },
  },
});

export const { hostRequestsFetched } = hostRequestsSlice.actions;
export default hostRequestsSlice.reducer;
