import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";

import * as pb_api_pb from "../pb/api_pb";
import * as pb_communities_pb from "../pb/communities_pb";
import * as pb_groups_pb from "../pb/groups_pb";
import * as pb_pages_pb from "../pb/pages_pb";

export class Area extends jspb.Message {
  getLat(): number;
  setLat(value: number): Area;

  getLng(): number;
  setLng(value: number): Area;

  getRadius(): number;
  setRadius(value: number): Area;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Area.AsObject;
  static toObject(includeInstance: boolean, msg: Area): Area.AsObject;
  static serializeBinaryToWriter(
    message: Area,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Area;
  static deserializeBinaryFromReader(
    message: Area,
    reader: jspb.BinaryReader
  ): Area;
}

export namespace Area {
  export type AsObject = {
    lat: number;
    lng: number;
    radius: number;
  };
}

export class SearchReq extends jspb.Message {
  getQuery(): string;
  setQuery(value: string): SearchReq;

  getIncludeUsers(): boolean;
  setIncludeUsers(value: boolean): SearchReq;

  getIncludeCommunities(): boolean;
  setIncludeCommunities(value: boolean): SearchReq;

  getIncludeGroups(): boolean;
  setIncludeGroups(value: boolean): SearchReq;

  getIncludePlaces(): boolean;
  setIncludePlaces(value: boolean): SearchReq;

  getIncludeGuides(): boolean;
  setIncludeGuides(value: boolean): SearchReq;

  getTitleOnly(): boolean;
  setTitleOnly(value: boolean): SearchReq;

  getPageSize(): number;
  setPageSize(value: number): SearchReq;

  getPageToken(): string;
  setPageToken(value: string): SearchReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchReq.AsObject;
  static toObject(includeInstance: boolean, msg: SearchReq): SearchReq.AsObject;
  static serializeBinaryToWriter(
    message: SearchReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): SearchReq;
  static deserializeBinaryFromReader(
    message: SearchReq,
    reader: jspb.BinaryReader
  ): SearchReq;
}

export namespace SearchReq {
  export type AsObject = {
    query: string;
    includeUsers: boolean;
    includeCommunities: boolean;
    includeGroups: boolean;
    includePlaces: boolean;
    includeGuides: boolean;
    titleOnly: boolean;
    pageSize: number;
    pageToken: string;
  };
}

export class Result extends jspb.Message {
  getRank(): number;
  setRank(value: number): Result;

  getSnippet(): string;
  setSnippet(value: string): Result;

  getUser(): pb_api_pb.User | undefined;
  setUser(value?: pb_api_pb.User): Result;
  hasUser(): boolean;
  clearUser(): Result;

  getCommunity(): pb_communities_pb.Community | undefined;
  setCommunity(value?: pb_communities_pb.Community): Result;
  hasCommunity(): boolean;
  clearCommunity(): Result;

  getGroup(): pb_groups_pb.Group | undefined;
  setGroup(value?: pb_groups_pb.Group): Result;
  hasGroup(): boolean;
  clearGroup(): Result;

  getPlace(): pb_pages_pb.Page | undefined;
  setPlace(value?: pb_pages_pb.Page): Result;
  hasPlace(): boolean;
  clearPlace(): Result;

  getGuide(): pb_pages_pb.Page | undefined;
  setGuide(value?: pb_pages_pb.Page): Result;
  hasGuide(): boolean;
  clearGuide(): Result;

  getResultCase(): Result.ResultCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Result.AsObject;
  static toObject(includeInstance: boolean, msg: Result): Result.AsObject;
  static serializeBinaryToWriter(
    message: Result,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Result;
  static deserializeBinaryFromReader(
    message: Result,
    reader: jspb.BinaryReader
  ): Result;
}

export namespace Result {
  export type AsObject = {
    rank: number;
    snippet: string;
    user?: pb_api_pb.User.AsObject;
    community?: pb_communities_pb.Community.AsObject;
    group?: pb_groups_pb.Group.AsObject;
    place?: pb_pages_pb.Page.AsObject;
    guide?: pb_pages_pb.Page.AsObject;
  };

  export enum ResultCase {
    RESULT_NOT_SET = 0,
    USER = 3,
    COMMUNITY = 4,
    GROUP = 5,
    PLACE = 6,
    GUIDE = 7,
  }
}

export class SearchRes extends jspb.Message {
  getResultsList(): Array<Result>;
  setResultsList(value: Array<Result>): SearchRes;
  clearResultsList(): SearchRes;
  addResults(value?: Result, index?: number): Result;

  getNextPageToken(): string;
  setNextPageToken(value: string): SearchRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchRes.AsObject;
  static toObject(includeInstance: boolean, msg: SearchRes): SearchRes.AsObject;
  static serializeBinaryToWriter(
    message: SearchRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): SearchRes;
  static deserializeBinaryFromReader(
    message: SearchRes,
    reader: jspb.BinaryReader
  ): SearchRes;
}

export namespace SearchRes {
  export type AsObject = {
    resultsList: Array<Result.AsObject>;
    nextPageToken: string;
  };
}

export class UserSearchReq extends jspb.Message {
  getQuery(): google_protobuf_wrappers_pb.StringValue | undefined;
  setQuery(value?: google_protobuf_wrappers_pb.StringValue): UserSearchReq;
  hasQuery(): boolean;
  clearQuery(): UserSearchReq;

  getQueryNameOnly(): boolean;
  setQueryNameOnly(value: boolean): UserSearchReq;

  getLastActive(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastActive(value?: google_protobuf_timestamp_pb.Timestamp): UserSearchReq;
  hasLastActive(): boolean;
  clearLastActive(): UserSearchReq;

  getSearchInArea(): Area | undefined;
  setSearchInArea(value?: Area): UserSearchReq;
  hasSearchInArea(): boolean;
  clearSearchInArea(): UserSearchReq;

  getSearchInCommunityId(): number;
  setSearchInCommunityId(value: number): UserSearchReq;

  getHostingStatusFilterList(): Array<pb_api_pb.HostingStatus>;
  setHostingStatusFilterList(
    value: Array<pb_api_pb.HostingStatus>
  ): UserSearchReq;
  clearHostingStatusFilterList(): UserSearchReq;
  addHostingStatusFilter(
    value: pb_api_pb.HostingStatus,
    index?: number
  ): UserSearchReq;

  getSmokingLocationFilterList(): Array<pb_api_pb.SmokingLocation>;
  setSmokingLocationFilterList(
    value: Array<pb_api_pb.SmokingLocation>
  ): UserSearchReq;
  clearSmokingLocationFilterList(): UserSearchReq;
  addSmokingLocationFilter(
    value: pb_api_pb.SmokingLocation,
    index?: number
  ): UserSearchReq;

  getSleepingArrangementFilterList(): Array<pb_api_pb.SleepingArrangement>;
  setSleepingArrangementFilterList(
    value: Array<pb_api_pb.SleepingArrangement>
  ): UserSearchReq;
  clearSleepingArrangementFilterList(): UserSearchReq;
  addSleepingArrangementFilter(
    value: pb_api_pb.SleepingArrangement,
    index?: number
  ): UserSearchReq;

  getParkingDetailsFilterList(): Array<pb_api_pb.ParkingDetails>;
  setParkingDetailsFilterList(
    value: Array<pb_api_pb.ParkingDetails>
  ): UserSearchReq;
  clearParkingDetailsFilterList(): UserSearchReq;
  addParkingDetailsFilter(
    value: pb_api_pb.ParkingDetails,
    index?: number
  ): UserSearchReq;

  getGender(): google_protobuf_wrappers_pb.StringValue | undefined;
  setGender(value?: google_protobuf_wrappers_pb.StringValue): UserSearchReq;
  hasGender(): boolean;
  clearGender(): UserSearchReq;

  getGuests(): google_protobuf_wrappers_pb.UInt32Value | undefined;
  setGuests(value?: google_protobuf_wrappers_pb.UInt32Value): UserSearchReq;
  hasGuests(): boolean;
  clearGuests(): UserSearchReq;

  getOnlyWithReferences(): boolean;
  setOnlyWithReferences(value: boolean): UserSearchReq;

  getLastMinute(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setLastMinute(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasLastMinute(): boolean;
  clearLastMinute(): UserSearchReq;

  getHasPets(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setHasPets(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasHasPets(): boolean;
  clearHasPets(): UserSearchReq;

  getAcceptsPets(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setAcceptsPets(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasAcceptsPets(): boolean;
  clearAcceptsPets(): UserSearchReq;

  getHasKids(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setHasKids(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasHasKids(): boolean;
  clearHasKids(): UserSearchReq;

  getAcceptsKids(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setAcceptsKids(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasAcceptsKids(): boolean;
  clearAcceptsKids(): UserSearchReq;

  getHasHousemates(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setHasHousemates(
    value?: google_protobuf_wrappers_pb.BoolValue
  ): UserSearchReq;
  hasHasHousemates(): boolean;
  clearHasHousemates(): UserSearchReq;

  getWheelchairAccessible(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setWheelchairAccessible(
    value?: google_protobuf_wrappers_pb.BoolValue
  ): UserSearchReq;
  hasWheelchairAccessible(): boolean;
  clearWheelchairAccessible(): UserSearchReq;

  getSmokesAtHome(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setSmokesAtHome(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasSmokesAtHome(): boolean;
  clearSmokesAtHome(): UserSearchReq;

  getDrinkingAllowed(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setDrinkingAllowed(
    value?: google_protobuf_wrappers_pb.BoolValue
  ): UserSearchReq;
  hasDrinkingAllowed(): boolean;
  clearDrinkingAllowed(): UserSearchReq;

  getDrinksAtHome(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setDrinksAtHome(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasDrinksAtHome(): boolean;
  clearDrinksAtHome(): UserSearchReq;

  getParking(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setParking(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasParking(): boolean;
  clearParking(): UserSearchReq;

  getCampingOk(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setCampingOk(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasCampingOk(): boolean;
  clearCampingOk(): UserSearchReq;

  getPageSize(): number;
  setPageSize(value: number): UserSearchReq;

  getPageToken(): string;
  setPageToken(value: string): UserSearchReq;

  getSearchInCase(): UserSearchReq.SearchInCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserSearchReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UserSearchReq
  ): UserSearchReq.AsObject;
  static serializeBinaryToWriter(
    message: UserSearchReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): UserSearchReq;
  static deserializeBinaryFromReader(
    message: UserSearchReq,
    reader: jspb.BinaryReader
  ): UserSearchReq;
}

export namespace UserSearchReq {
  export type AsObject = {
    query?: google_protobuf_wrappers_pb.StringValue.AsObject;
    queryNameOnly: boolean;
    lastActive?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    searchInArea?: Area.AsObject;
    searchInCommunityId: number;
    hostingStatusFilterList: Array<pb_api_pb.HostingStatus>;
    smokingLocationFilterList: Array<pb_api_pb.SmokingLocation>;
    sleepingArrangementFilterList: Array<pb_api_pb.SleepingArrangement>;
    parkingDetailsFilterList: Array<pb_api_pb.ParkingDetails>;
    gender?: google_protobuf_wrappers_pb.StringValue.AsObject;
    guests?: google_protobuf_wrappers_pb.UInt32Value.AsObject;
    onlyWithReferences: boolean;
    lastMinute?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    hasPets?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    acceptsPets?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    hasKids?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    acceptsKids?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    hasHousemates?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    wheelchairAccessible?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    smokesAtHome?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    drinkingAllowed?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    drinksAtHome?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    parking?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    campingOk?: google_protobuf_wrappers_pb.BoolValue.AsObject;
    pageSize: number;
    pageToken: string;
  };

  export enum SearchInCase {
    SEARCH_IN_NOT_SET = 0,
    SEARCH_IN_AREA = 28,
    SEARCH_IN_COMMUNITY_ID = 29,
  }
}

export class UserSearchRes extends jspb.Message {
  getResultsList(): Array<Result>;
  setResultsList(value: Array<Result>): UserSearchRes;
  clearResultsList(): UserSearchRes;
  addResults(value?: Result, index?: number): Result;

  getNextPageToken(): string;
  setNextPageToken(value: string): UserSearchRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserSearchRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UserSearchRes
  ): UserSearchRes.AsObject;
  static serializeBinaryToWriter(
    message: UserSearchRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): UserSearchRes;
  static deserializeBinaryFromReader(
    message: UserSearchRes,
    reader: jspb.BinaryReader
  ): UserSearchRes;
}

export namespace UserSearchRes {
  export type AsObject = {
    resultsList: Array<Result.AsObject>;
    nextPageToken: string;
  };
}
