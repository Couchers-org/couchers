import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { ListUserIdsReq } from "proto/admin_pb";

import client from "./client";

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
  console.log("GOT PAGE TOKEN", pageToken);
  req.setStartTime(Timestamp.fromDate(startTime));
  req.setEndTime(Timestamp.fromDate(endTime));
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  req.setPageSize(50);
  if (pageToken) {
    console.log("USING PAGE TOKEN", pageToken);
    req.setPageToken(pageToken);
  }
  console.log(req);
  const res = (await client.admin.listUserIds(req)).toObject();
  console.log("NEW PAGE TOKEN", res.nextPageToken);
  return res;
}
