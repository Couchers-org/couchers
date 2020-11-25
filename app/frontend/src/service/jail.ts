import { AcceptTOSReq, JailInfoRes } from "../pb/jail_pb";
import client from "./api";
import { getCurrentUser } from "./user";

export async function getIsJailed() {
  const req = new JailInfoRes();
  const isJailed = (await client.jail.jailInfo(req)).getJailed();
  const user = isJailed ? null : await getCurrentUser();
  return { isJailed, user };
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
