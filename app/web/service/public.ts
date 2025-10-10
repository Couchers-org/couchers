import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import client from "./client";

export async function getSignupPageInfo() {
  const res = await client.public.getSignupPageInfo(new Empty());
  return res.toObject();
}

export async function getVolunteers() {
  const res = await client.public.getVolunteers(new Empty());
  return res.toObject();
}
