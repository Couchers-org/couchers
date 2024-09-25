import { Coordinates } from "features/search/constants";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  BoolValue,
  StringValue,
  UInt32Value,
} from "google-protobuf/google/protobuf/wrappers_pb";
import { HostingStatus } from "proto/api_pb";
import {
  EventSearchReq,
  EventSearchRes,
  RectArea,
  UserSearchReq,
} from "proto/search_pb";
import client from "service/client";

export interface UserSearchFilters {
  query?: string;
  bbox?: Coordinates;
  lastActive?: number; //within x days
  hostingStatusOptions?: HostingStatus[];
  numGuests?: number;
  completeProfile?: boolean;
}

export async function userSearch(
  {
    query,
    bbox,
    lastActive,
    hostingStatusOptions,
    numGuests,
    completeProfile,
  }: UserSearchFilters,
  pageToken = ""
) {
  const req = new UserSearchReq();
  req.setPageToken(pageToken);

  if (query) {
    req.setQuery(new StringValue().setValue(query));
  }

  if (bbox !== undefined && bbox.join() !== "0,0,0,0") {
    const rectAreaSearch = new RectArea();

    rectAreaSearch.setLngMin(bbox[0]);
    rectAreaSearch.setLatMin(bbox[1]);
    rectAreaSearch.setLngMax(bbox[2]);
    rectAreaSearch.setLatMax(bbox[3]);

    req.setSearchInRectangle(rectAreaSearch);
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

export async function EventSearch({
  query,
  pageSize,
  pageToken,
  pastEvents,
  isMyCommunities,
  isOnlineOnly,
}: {
  query?: string;
  pageSize: number;
  pageToken: string;
  pastEvents?: boolean;
  isMyCommunities?: boolean;
  isOnlineOnly?: boolean;
}): Promise<EventSearchRes.AsObject> {
  const req = new EventSearchReq();
  req.setPageSize(pageSize);
  req.setPageToken(pageToken);

  if (pastEvents !== undefined) {
    req.setPast(pastEvents);
  }
  if (query) {
    req.hasQuery();
    const queryValue = new StringValue();
    queryValue.setValue(query);
    req.setQuery(queryValue);
  }
  if (isMyCommunities !== undefined) {
    req.setMyCommunities(isMyCommunities);
  }
  if (isOnlineOnly !== undefined) {
    req.setOnlyOnline(isOnlineOnly);
  }

  const res = await client.search.eventSearch(req);
  return res.toObject();
}
