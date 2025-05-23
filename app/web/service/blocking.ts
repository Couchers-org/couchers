import { BlockUserReq } from "proto/blocking_pb";

import client from "./client";

export interface BlockInput {
  shouldBlock: boolean;
}

export function blockUser({ username }: { username: string }) {
  const req = new BlockUserReq();
  req.setUsername(username);
  return client.blocking.blockUser(req);
}
