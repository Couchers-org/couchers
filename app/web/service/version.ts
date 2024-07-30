import { StatusReq } from "proto/bugs_pb";
import client from "service/client";

export async function status(message: string = "") {
  const req = new StatusReq();
  req.setNonce(message);
  const res = await client.bugs.status(req);
  if (res.getNonce() !== message) {
    throw new Error("Backend didn't return right nonce!")
  }
  return res.toObject();
}
