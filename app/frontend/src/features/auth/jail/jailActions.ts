import { createAsyncThunk } from "@reduxjs/toolkit";
import { getIsJailed } from "../../../service/jail";

export const updateJailStatus = createAsyncThunk(
  "jail/updateJailStatus",
  async () => {
    const isJailed = await getIsJailed();

    return isJailed;
  }
);
