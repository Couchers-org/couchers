import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../../service";

export const updateJailStatus = createAsyncThunk(
  "jail/updateJailStatus",
  async () => {
    const isJailed = await service.jail.getIsJailed();

    return isJailed;
  }
);
