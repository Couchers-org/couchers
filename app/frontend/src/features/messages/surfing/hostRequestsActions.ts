import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../../../reducers";
import { service } from "../../../service";
import { hostRequestsFetched } from "./hostRequestsSlice";

type FetchHostRequestsArguments = {};

export const fetchHostRequests = createAsyncThunk<
  void,
  FetchHostRequestsArguments,
  { state: RootState }
>(
  "hostRequests/fetchHostRequests",
  async ({}: FetchHostRequestsArguments = {}, thunkApi) => {
    const hostRequests = await service.requests.listHostRequests();
    thunkApi.dispatch(hostRequestsFetched(hostRequests));
  }
);
