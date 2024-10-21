import { Coordinates } from "features/search/constants";
import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  BoolValue,
  StringValue,
  UInt32Value,
} from "google-protobuf/google/protobuf/wrappers_pb";
import { HostingStatus, SleepingArrangement } from "proto/api_pb";
import { RectArea, UserSearchReq } from "proto/search_pb";
import client from "service/client";

export interface UserSearchFilters {
  query?: string;
  bbox?: Coordinates;
  lastActive?: number; //within x days
  hostingStatusOptions?: HostingStatus[];
  numGuests?: number;
  completeProfile?: boolean;
  acceptsKids?: boolean;
  acceptsPets?: boolean;
  drinkingAllowed?: boolean;
  smokingAllowed?: boolean;
  wheelChairAccessible?: boolean;
  hasParking?: boolean;
  campingOk?: boolean;
  sleepingArrangement?: SleepingArrangement[];
}

export async function userSearch(
  {
    query,
    bbox,
    lastActive,
    hostingStatusOptions,
    numGuests,
    completeProfile,
    acceptsKids,
    acceptsPets,
    drinkingAllowed,
    smokingAllowed,
    wheelChairAccessible,
    hasParking,
    campingOk,
    sleepingArrangement,
  }: UserSearchFilters,
  pageToken = ""
) {
  const req = new UserSearchReq();
  req.setPageToken(pageToken);

  // Rules
  if (acceptsKids) {
    req.setAcceptsKids(new BoolValue().setValue(acceptsKids));
  }
  if (acceptsPets) {
    req.setAcceptsPets(new BoolValue().setValue(acceptsPets));
  }
  if (drinkingAllowed) {
    req.setDrinkingAllowed(new BoolValue().setValue(drinkingAllowed));
  }
  if (smokingAllowed) {
    // setSmokingAllowed(false); // TODO: missing in backend
  }

  // Other
  if (wheelChairAccessible) {
    req.setWheelchairAccessible(new BoolValue().setValue(wheelChairAccessible));
  }
  if (hasParking) {
    req.setParking(new BoolValue().setValue(hasParking));
  }
  if (campingOk) {
    req.setCampingOk(new BoolValue().setValue(campingOk));
  }

  // Type of place
  if (sleepingArrangement) {
    req.setSleepingArrangementFilterList(sleepingArrangement);
  }
  /*
  SLEEPING_ARRANGEMENT_PRIVATE = 2,
  SLEEPING_ARRANGEMENT_SHARED_ROOM = 4
  */

  // hosting status
  req.setHostingStatusFilterList([]);
  /*
    HostingStatus.HOSTING_STATUS_CAN_HOST
    HostingStatus.HOSTING_STATUS_MAYBE
  */

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
