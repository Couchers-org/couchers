import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import log from "@/log";
import {
  CancelFriendRequestReq,
  ListBadgeUsersReq,
  PingReq,
  RemoveFriendReq,
  RespondFriendRequestReq,
  SendFriendRequestReq,
} from "@/proto/api_pb";

import client from "./client";
import {
  FETCH_FAILED,
  IMAGE_TOO_LARGE,
  INTERNAL_ERROR,
  SERVER_ERROR,
} from "./constants";

export const cancelFriendRequest = (friendRequestId: number) => {
  const req = new CancelFriendRequestReq();
  req.setFriendRequestId(friendRequestId);
  return client.api.cancelFriendRequest(req);
};

export const listFriends = async () => {
  const req = new Empty();
  const response = await client.api.listFriends(req);
  return response.toObject().userIdsList;
};

export const listFriendRequests = async () => {
  const req = new Empty();
  const response = await client.api.listFriendRequests(req);
  return response.toObject();
};

export const removeFriend = (friendId: number) => {
  const req = new RemoveFriendReq();
  req.setUserId(friendId);
  return client.api.removeFriend(req);
};

export const respondFriendRequest = (
  friendRequestId: number,
  accept: boolean,
) => {
  const req = new RespondFriendRequestReq();
  req.setFriendRequestId(friendRequestId);
  req.setAccept(accept);
  return client.api.respondFriendRequest(req);
};

export const sendFriendRequest = (userId: number) => {
  const req = new SendFriendRequestReq();
  req.setUserId(userId);
  return client.api.sendFriendRequest(req);
};

export const ping = async () => {
  const req = new PingReq();
  const response = await client.api.ping(req);
  return response.toObject();
};

/* eslint-disable @typescript-eslint/naming-convention */
export interface ImageInputValues {
  file: File;
  filename: string;
  key: string;
  thumbnail_url: string;
  full_url: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export const uploadFile = async (file: File): Promise<ImageInputValues> => {
  const urlResponse = await client.api.initiateMediaUpload(new Empty());
  const uploadURL = urlResponse.getUploadUrl();

  const requestBody = new FormData();
  requestBody.append("file", file);

  const uploadResponse = await fetch(uploadURL, {
    method: "POST",
    body: requestBody,
  }).catch((e: unknown) => {
    log.error(e);
    throw new Error(FETCH_FAILED);
  });

  if (uploadResponse.status === 413) {
    throw new Error(IMAGE_TOO_LARGE);
  } else if (!uploadResponse.ok) {
    throw new Error(`${SERVER_ERROR}: ${uploadResponse.statusText}`);
  }

  const responseJson = (await uploadResponse.json().catch((e: unknown) => {
    log.error(e);
    if (e instanceof Error) {
      throw new Error(`${INTERNAL_ERROR}: ${e.message}`);
    }
    throw new Error(`${INTERNAL_ERROR}: Unknown error`);
  })) as ImageInputValues;
  return {
    ...responseJson,
    file,
  };
};

export interface ListBadgeUsersInput {
  badgeId: string;
  pageSize?: number;
  pageToken?: string;
}

export const listBadgeUsers = async ({
  badgeId,
  pageSize,
  pageToken,
}: ListBadgeUsersInput) => {
  const req = new ListBadgeUsersReq();
  req.setBadgeId(badgeId);
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
  }

  const res = await client.api.listBadgeUsers(req);
  return res.toObject();
};
