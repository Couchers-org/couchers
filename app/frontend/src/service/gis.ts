import { IsOnLandReq } from "../pb/gis_pb";
import client from "./client";

export async function isOnLand(lat: number, lng: number) {
  const req = new IsOnLandReq();
  req.setLat(lat)
  req.setLng(lng)
  return (await client.gis.isOnLand(req)).getOnLand();
}
