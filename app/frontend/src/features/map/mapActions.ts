import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";

export const onLand = createAsyncThunk(
  "map/onLand",
  async ({ lat, lng }: { lat: number; lng: number }) => {
    return await service.gis.isOnLand(lat, lng);
  }
);

export const getRegion = createAsyncThunk(
  "map/getRegion",
  async ({ lat, lng }: { lat: number; lng: number }) => {
    return await service.gis.getRegion(lat, lng);
  }
);
