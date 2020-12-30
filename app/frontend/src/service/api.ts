import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { CancelFriendRequestReq } from "../pb/api_pb";
import client from "./client";

export function cancelFriendRequest(friendRequestId: number) {
  const req = new CancelFriendRequestReq();
  req.setFriendRequestId(friendRequestId);
  return client.api.cancelFriendRequest(req);
}

export async function listFriends() {
  const req = new Empty();

  const response = await client.api.listFriends(req);
  return response.toObject().userIdsList;
}

export async function listFriendRequests() {
  const req = new Empty();

  const response = await client.api.listFriendRequests(req);
  return response.toObject();
}
