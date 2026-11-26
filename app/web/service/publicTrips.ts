import {
  CreatePublicTripReq,
  ListMyCommunitiesPublicTripsReq,
  ListPublicTripsByUserReq,
  ListPublicTripsReq,
  OfferToHostReq,
  PublicTripStatus,
  UpdatePublicTripReq,
} from "proto/public_trips_pb";
import { Temporal } from "temporal-polyfill";

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
  ascending,
  includePast,
}: {
  userId: number;
  pageToken?: string;
  pageSize?: number;
  ascending?: boolean;
  includePast?: boolean;
}) {
  const req = new ListPublicTripsByUserReq();
  req.setUserId(userId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (ascending !== undefined) {
    req.setAscending(ascending);
  }
  if (includePast !== undefined) {
    req.setIncludePast(includePast);
  }
  const res = await client.publicTrips.listPublicTripsByUser(req);
  return res.toObject();
}

export async function listMyCommunitiesPublicTrips({ pageToken, pageSize }: { pageToken?: string; pageSize?: number }) {
  const req = new ListMyCommunitiesPublicTripsReq();
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const res = await client.publicTrips.listMyCommunitiesPublicTrips(req);
  return res.toObject();
}

export async function createPublicTrip({
  communityId,
  fromDate,
  toDate,
  description,
  sameGenderOnly,
}: {
  communityId: number;
  fromDate: Temporal.PlainDate;
  toDate: Temporal.PlainDate;
  description: string;
  sameGenderOnly: boolean;
}) {
  const req = new CreatePublicTripReq();
  req.setCommunityId(communityId);
  req.setFromDate(fromDate.toString());
  req.setToDate(toDate.toString());
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
  fromDate?: Temporal.PlainDate;
  toDate?: Temporal.PlainDate;
  description?: string;
  status?: PublicTripStatus;
  sameGenderOnly?: boolean;
}) {
  const req = new UpdatePublicTripReq();
  req.setTripId(tripId);
  if (fromDate !== undefined) req.setFromDate(fromDate.toString());
  if (toDate !== undefined) req.setToDate(toDate.toString());
  if (description !== undefined) req.setDescription(description);
  if (status !== undefined) req.setStatus(status);
  if (sameGenderOnly !== undefined) req.setSameGenderOnly(sameGenderOnly);
  const res = await client.publicTrips.updatePublicTrip(req);
  return res.toObject();
}

export async function offerToHost({
  tripId,
  fromDate,
  toDate,
  text,
}: {
  tripId: number;
  fromDate: Temporal.PlainDate;
  toDate: Temporal.PlainDate;
  text: string;
}) {
  const req = new OfferToHostReq();
  req.setTripId(tripId);
  req.setFromDate(fromDate.toString());
  req.setToDate(toDate.toString());
  req.setText(text);
  const res = await client.publicTrips.offerToHost(req);
  return res.getHostRequestId();
}
