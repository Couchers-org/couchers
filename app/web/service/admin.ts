import {
  GetUserDetailsReq,
  GetUserReq,
  ListUserIdsReq,
  UserDetails,
} from "couchers/proto/admin_pb";
import { User } from "couchers/proto/api_pb";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";

import client from "./client";

export async function getUser(user: string): Promise<User.AsObject> {
  const req = new GetUserReq();
  if (user) {
    req.setUser(user);
  }
  return (await client.admin.getUser(req)).toObject();
}

export async function getUserDetails(
  user: string,
): Promise<UserDetails.AsObject> {
  const req = new GetUserDetailsReq();
  if (user) {
    req.setUser(user);
  }
  return (await client.admin.getUserDetails(req)).toObject();
}

interface ListUserIdsInput {
  startTime: Date;
  endTime: Date;
  pageSize?: number;
  pageToken?: string;
}

export async function listUserIds({
  startTime,
  endTime,
  pageSize,
  pageToken,
}: ListUserIdsInput) {
  const req = new ListUserIdsReq();
  req.setStartTime(Timestamp.fromDate(startTime));
  req.setEndTime(Timestamp.fromDate(endTime));
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  return (await client.admin.listUserIds(req)).toObject();
}
