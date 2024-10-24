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
import { GeocodeResult } from "utils/hooks";

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
  pageNumber,
  pageSize,
  pastEvents,
  isMyCommunities,
  isOnlineOnly,
  searchLocation,
}: {
  pageNumber: number;
  pageSize: number;
  pastEvents?: boolean;
  isMyCommunities?: boolean;
  isOnlineOnly?: boolean;
  searchLocation?: GeocodeResult | "";
}): Promise<EventSearchRes.AsObject> {
  const req = new EventSearchReq();
  req.setPageSize(pageSize);
  req.setPageNumber(pageNumber);

  if (pastEvents !== undefined) {
    req.setPast(pastEvents);
  }
  if (typeof searchLocation !== "string") {
    // If it's a region (i.e. "France" or "United States") use query search by name
    // This will search for events in the region by that name
    if (searchLocation?.isRegion) {
      req.setQuery(new StringValue().setValue(searchLocation.name));
    } else {
      // Otherwise use rectangle search so we get the area around a city
      // This is because if you search a small town, you might want to search around it too
      const location = new RectArea();
      location.setLatMin(searchLocation?.bbox[1] || 0);
      location.setLatMax(searchLocation?.bbox[3] || 0);
      location.setLngMin(searchLocation?.bbox[0] || 0);
      location.setLngMax(searchLocation?.bbox[2] || 0);
      req.setSearchInRectangle(location);
    }
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
