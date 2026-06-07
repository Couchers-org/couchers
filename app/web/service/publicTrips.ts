import {
  CreatePublicTripReq,
  ListPublicTripsByUserReq,
  ListPublicTripsReq,
  PublicTripStatus,
  UpdatePublicTripReq,
} from "proto/public_trips_pb";

import client from "./client";

export async function listPublicTrips({
  communityId,
  pageToken,
  pageSize,
}: {
  communityId: number;
  pageToken?: string;
  pageSize?: number;
}) {
  const req = new ListPublicTripsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const res = await client.publicTrips.listPublicTrips(req);
  return res.toObject();
}

export async function listPublicTripsByUser({
  userId,
  pageToken,
  pageSize,
}: {
  userId: number;
  pageToken?: string;
  pageSize?: number;
}) {
  const req = new ListPublicTripsByUserReq();
  req.setUserId(userId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const res = await client.publicTrips.listPublicTripsByUser(req);
  return res.toObject();
}

export async function createPublicTrip({
  nodeId,
  fromDate,
  toDate,
  description,
  sameGenderOnly,
}: {
  nodeId: number;
  fromDate: string;
  toDate: string;
  description: string;
  sameGenderOnly: boolean;
}) {
  const req = new CreatePublicTripReq();
  req.setNodeId(nodeId);
  req.setFromDate(fromDate);
  req.setToDate(toDate);
  req.setDescription(description);
  req.setSameGenderOnly(sameGenderOnly);
  const res = await client.publicTrips.createPublicTrip(req);
  return res.toObject();
}

export async function updatePublicTrip({
  tripId,
  fromDate,
  toDate,
  description,
  status,
  sameGenderOnly,
}: {
  tripId: number;
  fromDate?: string;
  toDate?: string;
  description?: string;
  status?: PublicTripStatus;
  sameGenderOnly?: boolean;
}) {
  const req = new UpdatePublicTripReq();
  req.setTripId(tripId);
  if (fromDate !== undefined) req.setFromDate(fromDate);
  if (toDate !== undefined) req.setToDate(toDate);
  if (description !== undefined) req.setDescription(description);
  if (status !== undefined) req.setStatus(status);
  if (sameGenderOnly !== undefined) req.setSameGenderOnly(sameGenderOnly);
  const res = await client.publicTrips.updatePublicTrip(req);
  return res.toObject();
}
