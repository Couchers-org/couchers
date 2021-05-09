import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import client from "service/client";

export async function getTermsOfService() {
  const res = await client.resources.getTermsOfService(new Empty());

  return res.toObject();
}
