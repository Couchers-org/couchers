import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";

export const onLand = createAsyncThunk(
  "map/onLand",
  async ({ lat, lng }: { lat: number; lng: number }) => {
    const onLand = await service.gis.isOnLand(lat, lng);
    console.log(`On land: ${onLand}`);
  }
);

export const getRegion = createAsyncThunk(
  "map/getRegion",
  async ({ lat, lng }: { lat: number; lng: number }) => {
    const region = await service.gis.getRegion(lat, lng);
    console.log(`Region: ${region}`);
  }
);
