import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  StringValue,
  UInt32Value,
} from "google-protobuf/google/protobuf/wrappers_pb";
import { HostingStatus } from "proto/api_pb";
import { Area, UserSearchReq } from "proto/search_pb";
import client from "service/client";
import { BoolValue } from "google-protobuf/google/protobuf/wrappers_pb";

export interface UserSearchFilters {
  query?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  lastActive?: number; //within x days
  hostingStatusOptions?: HostingStatus[];
  numGuests?: number;
  bbox?: [number, number, number, number];
  completeProfile?: boolean;
}

export async function userSearch(
  {
    query,
    lat,
    lng,
    radius,
    lastActive,
    hostingStatusOptions,
    numGuests,
    completeProfile,
  }: UserSearchFilters,
  pageToken = ""
) {

  /*
  console.debug('---------------');

  console.debug(query);
  console.debug(lat);
  console.debug(lng);
  console.debug(radius);
  console.debug(lastActive);
  console.debug(hostingStatusOptions); // here 0 when from 'any' to other value and then back to 'any' again
  console.debug(numGuests);
  console.debug(pageToken);
  */

  const req = new UserSearchReq();
  req.setPageToken(pageToken);

  if (query !== undefined) {
    req.setQuery(new StringValue().setValue(query));
  }

  if (lat !== undefined && lng !== undefined) {
    const area = new Area().setLat(lat).setLng(lng);
    if (radius) {
      area.setRadius(radius);
      req.setSearchInArea(area);
    } else {
      throw Error("Tried to search an area without a radius");
    }
  }

  if (lastActive) {
    const timestamp = new Timestamp();
    timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * lastActive));
    req.setLastActive(timestamp);
  }

  if (completeProfile) {
    req.setProfileCompleted(new BoolValue().setValue(completeProfile));
  }

  if (hostingStatusOptions && hostingStatusOptions.length !== 0) {
    req.setHostingStatusFilterList(hostingStatusOptions);
  }

  if (numGuests) {
    req.setGuests(new UInt32Value().setValue(numGuests));
  }

  const response = await client.search.userSearch(req);
  return response.toObject();
}
