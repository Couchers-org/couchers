import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import client from "./client";

export async function getSignupPageInfo() {
  const res = await client.public.getSignupPageInfo(new Empty());
  return res.toObject();
}
