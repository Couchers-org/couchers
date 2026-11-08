import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import client from "./client";

export async function getAccountInfo() {
  const res = await client.account.getAccountInfo(new Empty());
  return res.toObject();
}
