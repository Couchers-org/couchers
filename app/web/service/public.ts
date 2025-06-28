import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import client from "./client";

export async function getSignupPageInfo() {
  const res = await client.public.getSignupPageInfo(new Empty());
  const objectRes = res.toObject();

  console.log("OBJECT RES", objectRes);

  return objectRes;
}
