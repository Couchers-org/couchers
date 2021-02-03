import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {
  CancelFriendRequestReq,
  PingReq,
  RespondFriendRequestReq,
  SendFriendRequestReq,
} from "../pb/api_pb";
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

export function respondFriendRequest(friendRequestId: number, accept: boolean) {
  const req = new RespondFriendRequestReq();

  req.setFriendRequestId(friendRequestId);
  req.setAccept(accept);

  return client.api.respondFriendRequest(req);
}

export function sendFriendRequest(userId: number) {
  const req = new SendFriendRequestReq();
  req.setUserId(userId);
  return client.api.sendFriendRequest(req);
}

export async function ping() {
  const req = new PingReq();
  const response = await client.api.ping(req);

  return response.toObject();
}
