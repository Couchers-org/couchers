import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";

export const onLand = createAsyncThunk(
  "map/onLand",
  async ({ lat, lng }: { lat: number; lng: number }) => {
    const onLand = await service.gis.isOnLand(lat, lng)
    console.log(`On land: ${onLand}`)
  }
);
