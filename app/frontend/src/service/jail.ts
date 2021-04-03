import { AcceptTOSReq, JailInfoRes, SetLocationReq } from "pb/jail_pb";
import client from "service/client";
import { getCurrentUser } from "service/user";

export async function getIsJailed() {
  const req = new JailInfoRes();
  const isJailed = (await client.jail.jailInfo(req)).getJailed();
  if (!isJailed) {
    const user = await getCurrentUser();
    return { isJailed, user };
  }

  return { isJailed, user: null };
}

export async function getJailInfo() {
  const req = new JailInfoRes();
  const res = await client.jail.jailInfo(req);
  return res.toObject();
}

export async function acceptTOS() {
  const req = new AcceptTOSReq();
  req.setAccept(true);
  const res = await client.jail.acceptTOS(req);
  return { isJailed: res.getJailed() };
}

export async function setLocation(
  city: string,
  lat: number,
  lng: number,
  radius: number
) {
  const req = new SetLocationReq();
  req.setCity(city).setLat(lat).setLng(lng).setRadius(radius);
  const res = await client.jail.setLocation(req);
  return { isJailed: res.getJailed() };
}
