import { StatusReq } from "@couchers/services/bugs";

import client from "./client";

export const status = async (message = "") => {
  const req = new StatusReq();
  req.setNonce(message);
  const res = await client.bugs.status(req);
  if (res.getNonce() !== message) {
    throw new Error("Backend didn't return right nonce!");
  }
  return res.toObject();
};
