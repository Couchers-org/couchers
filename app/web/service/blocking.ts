import { BlockUserReq } from "couchers/proto/blocking_pb";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import client from "./client";

export interface BlockInput {
  shouldBlock: boolean;
}

export async function getBlockedUsers() {
  const req = new Empty();

  const response = await client.blocking.getBlockedUsers(req);

  return response.toObject();
}

export async function blockUser({ username }: { username: string }) {
  const req = new BlockUserReq();
  req.setUsername(username);

  return await client.blocking.blockUser(req);
}

export async function unblockUser({ username }: { username: string }) {
  const req = new BlockUserReq();
  req.setUsername(username);

  return await client.blocking.unblockUser(req);
}
