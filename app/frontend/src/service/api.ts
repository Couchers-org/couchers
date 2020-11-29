import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import client from "./client";

export async function listFriends() {
  const req = new Empty();

  const response = await client.api.listFriends(req);
  return response.toObject().userIdsList;
}
