import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb'; // proto import: "google/protobuf/wrappers.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as api_pb from './api_pb'; // proto import: "api.proto"
import * as communities_pb from './communities_pb'; // proto import: "communities.proto"
import * as events_pb from './events_pb'; // proto import: "events.proto"
import * as groups_pb from './groups_pb'; // proto import: "groups.proto"
import * as pages_pb from './pages_pb'; // proto import: "pages.proto"


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
  static serializeBinaryToWriter(message: Area, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Area;
  static deserializeBinaryFromReader(message: Area, reader: jspb.BinaryReader): Area;
}

export namespace Area {
  export type AsObject = {
    lat: number,
    lng: number,
    radius: number,
  }
}

export class RectArea extends jspb.Message {
  getLatMin(): number;
  setLatMin(value: number): RectArea;

  getLatMax(): number;
  setLatMax(value: number): RectArea;

  getLngMin(): number;
  setLngMin(value: number): RectArea;

  getLngMax(): number;
  setLngMax(value: number): RectArea;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RectArea.AsObject;
  static toObject(includeInstance: boolean, msg: RectArea): RectArea.AsObject;
  static serializeBinaryToWriter(message: RectArea, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RectArea;
  static deserializeBinaryFromReader(message: RectArea, reader: jspb.BinaryReader): RectArea;
}

export namespace RectArea {
  export type AsObject = {
    latMin: number,
    latMax: number,
    lngMin: number,
    lngMax: number,
  }
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

  getIncludeEvents(): boolean;
  setIncludeEvents(value: boolean): SearchReq;

  getTitleOnly(): boolean;
  setTitleOnly(value: boolean): SearchReq;

  getPageSize(): number;
  setPageSize(value: number): SearchReq;

  getPageToken(): string;
  setPageToken(value: string): SearchReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchReq.AsObject;
  static toObject(includeInstance: boolean, msg: SearchReq): SearchReq.AsObject;
  static serializeBinaryToWriter(message: SearchReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchReq;
  static deserializeBinaryFromReader(message: SearchReq, reader: jspb.BinaryReader): SearchReq;
}

export namespace SearchReq {
  export type AsObject = {
    query: string,
    includeUsers: boolean,
    includeCommunities: boolean,
    includeGroups: boolean,
    includePlaces: boolean,
    includeGuides: boolean,
    includeEvents: boolean,
    titleOnly: boolean,
    pageSize: number,
    pageToken: string,
  }
}

export class Result extends jspb.Message {
  getRank(): number;
  setRank(value: number): Result;

  getSnippet(): string;
  setSnippet(value: string): Result;

  getUser(): api_pb.User | undefined;
  setUser(value?: api_pb.User): Result;
  hasUser(): boolean;
  clearUser(): Result;

  getCommunity(): communities_pb.Community | undefined;
  setCommunity(value?: communities_pb.Community): Result;
  hasCommunity(): boolean;
  clearCommunity(): Result;

  getGroup(): groups_pb.Group | undefined;
  setGroup(value?: groups_pb.Group): Result;
  hasGroup(): boolean;
  clearGroup(): Result;

  getPlace(): pages_pb.Page | undefined;
  setPlace(value?: pages_pb.Page): Result;
  hasPlace(): boolean;
  clearPlace(): Result;

  getGuide(): pages_pb.Page | undefined;
  setGuide(value?: pages_pb.Page): Result;
  hasGuide(): boolean;
  clearGuide(): Result;

  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): Result;
  hasEvent(): boolean;
  clearEvent(): Result;

  getResultCase(): Result.ResultCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Result.AsObject;
  static toObject(includeInstance: boolean, msg: Result): Result.AsObject;
  static serializeBinaryToWriter(message: Result, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Result;
  static deserializeBinaryFromReader(message: Result, reader: jspb.BinaryReader): Result;
}

export namespace Result {
  export type AsObject = {
    rank: number,
    snippet: string,
    user?: api_pb.User.AsObject,
    community?: communities_pb.Community.AsObject,
    group?: groups_pb.Group.AsObject,
    place?: pages_pb.Page.AsObject,
    guide?: pages_pb.Page.AsObject,
    event?: events_pb.Event.AsObject,
  }

  export enum ResultCase { 
    RESULT_NOT_SET = 0,
    USER = 3,
    COMMUNITY = 4,
    GROUP = 5,
    PLACE = 6,
    GUIDE = 7,
    EVENT = 8,
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
  static serializeBinaryToWriter(message: SearchRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchRes;
  static deserializeBinaryFromReader(message: SearchRes, reader: jspb.BinaryReader): SearchRes;
}

export namespace SearchRes {
  export type AsObject = {
    resultsList: Array<Result.AsObject>,
    nextPageToken: string,
  }
}

export class UserSearchReq extends jspb.Message {
  getExactlyUserIdsList(): Array<number>;
  setExactlyUserIdsList(value: Array<number>): UserSearchReq;
  clearExactlyUserIdsList(): UserSearchReq;
  addExactlyUserIds(value: number, index?: number): UserSearchReq;

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

  getSearchInRectangle(): RectArea | undefined;
  setSearchInRectangle(value?: RectArea): UserSearchReq;
  hasSearchInRectangle(): boolean;
  clearSearchInRectangle(): UserSearchReq;

  getHostingStatusFilterList(): Array<api_pb.HostingStatus>;
  setHostingStatusFilterList(value: Array<api_pb.HostingStatus>): UserSearchReq;
  clearHostingStatusFilterList(): UserSearchReq;
  addHostingStatusFilter(value: api_pb.HostingStatus, index?: number): UserSearchReq;

  getSmokingLocationFilterList(): Array<api_pb.SmokingLocation>;
  setSmokingLocationFilterList(value: Array<api_pb.SmokingLocation>): UserSearchReq;
  clearSmokingLocationFilterList(): UserSearchReq;
  addSmokingLocationFilter(value: api_pb.SmokingLocation, index?: number): UserSearchReq;

  getSleepingArrangementFilterList(): Array<api_pb.SleepingArrangement>;
  setSleepingArrangementFilterList(value: Array<api_pb.SleepingArrangement>): UserSearchReq;
  clearSleepingArrangementFilterList(): UserSearchReq;
  addSleepingArrangementFilter(value: api_pb.SleepingArrangement, index?: number): UserSearchReq;

  getParkingDetailsFilterList(): Array<api_pb.ParkingDetails>;
  setParkingDetailsFilterList(value: Array<api_pb.ParkingDetails>): UserSearchReq;
  clearParkingDetailsFilterList(): UserSearchReq;
  addParkingDetailsFilter(value: api_pb.ParkingDetails, index?: number): UserSearchReq;

  getMeetupStatusFilterList(): Array<api_pb.MeetupStatus>;
  setMeetupStatusFilterList(value: Array<api_pb.MeetupStatus>): UserSearchReq;
  clearMeetupStatusFilterList(): UserSearchReq;
  addMeetupStatusFilter(value: api_pb.MeetupStatus, index?: number): UserSearchReq;

  getLanguageAbilityFilterList(): Array<api_pb.LanguageAbility>;
  setLanguageAbilityFilterList(value: Array<api_pb.LanguageAbility>): UserSearchReq;
  clearLanguageAbilityFilterList(): UserSearchReq;
  addLanguageAbilityFilter(value?: api_pb.LanguageAbility, index?: number): api_pb.LanguageAbility;

  getGenderList(): Array<string>;
  setGenderList(value: Array<string>): UserSearchReq;
  clearGenderList(): UserSearchReq;
  addGender(value: string, index?: number): UserSearchReq;

  getGuests(): google_protobuf_wrappers_pb.UInt32Value | undefined;
  setGuests(value?: google_protobuf_wrappers_pb.UInt32Value): UserSearchReq;
  hasGuests(): boolean;
  clearGuests(): UserSearchReq;

  getOnlyWithReferences(): boolean;
  setOnlyWithReferences(value: boolean): UserSearchReq;

  getOnlyWithStrongVerification(): boolean;
  setOnlyWithStrongVerification(value: boolean): UserSearchReq;

  getAgeMin(): google_protobuf_wrappers_pb.UInt32Value | undefined;
  setAgeMin(value?: google_protobuf_wrappers_pb.UInt32Value): UserSearchReq;
  hasAgeMin(): boolean;
  clearAgeMin(): UserSearchReq;

  getAgeMax(): google_protobuf_wrappers_pb.UInt32Value | undefined;
  setAgeMax(value?: google_protobuf_wrappers_pb.UInt32Value): UserSearchReq;
  hasAgeMax(): boolean;
  clearAgeMax(): UserSearchReq;

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
  setHasHousemates(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasHasHousemates(): boolean;
  clearHasHousemates(): UserSearchReq;

  getWheelchairAccessible(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setWheelchairAccessible(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasWheelchairAccessible(): boolean;
  clearWheelchairAccessible(): UserSearchReq;

  getSmokesAtHome(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setSmokesAtHome(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasSmokesAtHome(): boolean;
  clearSmokesAtHome(): UserSearchReq;

  getDrinkingAllowed(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setDrinkingAllowed(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
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

  getProfileCompleted(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setProfileCompleted(value?: google_protobuf_wrappers_pb.BoolValue): UserSearchReq;
  hasProfileCompleted(): boolean;
  clearProfileCompleted(): UserSearchReq;

  getPageSize(): number;
  setPageSize(value: number): UserSearchReq;

  getPageToken(): string;
  setPageToken(value: string): UserSearchReq;

  getSearchInCase(): UserSearchReq.SearchInCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserSearchReq.AsObject;
  static toObject(includeInstance: boolean, msg: UserSearchReq): UserSearchReq.AsObject;
  static serializeBinaryToWriter(message: UserSearchReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserSearchReq;
  static deserializeBinaryFromReader(message: UserSearchReq, reader: jspb.BinaryReader): UserSearchReq;
}

export namespace UserSearchReq {
  export type AsObject = {
    exactlyUserIdsList: Array<number>,
    query?: google_protobuf_wrappers_pb.StringValue.AsObject,
    queryNameOnly: boolean,
    lastActive?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    searchInArea?: Area.AsObject,
    searchInCommunityId: number,
    searchInRectangle?: RectArea.AsObject,
    hostingStatusFilterList: Array<api_pb.HostingStatus>,
    smokingLocationFilterList: Array<api_pb.SmokingLocation>,
    sleepingArrangementFilterList: Array<api_pb.SleepingArrangement>,
    parkingDetailsFilterList: Array<api_pb.ParkingDetails>,
    meetupStatusFilterList: Array<api_pb.MeetupStatus>,
    languageAbilityFilterList: Array<api_pb.LanguageAbility.AsObject>,
    genderList: Array<string>,
    guests?: google_protobuf_wrappers_pb.UInt32Value.AsObject,
    onlyWithReferences: boolean,
    onlyWithStrongVerification: boolean,
    ageMin?: google_protobuf_wrappers_pb.UInt32Value.AsObject,
    ageMax?: google_protobuf_wrappers_pb.UInt32Value.AsObject,
    lastMinute?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    hasPets?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    acceptsPets?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    hasKids?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    acceptsKids?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    hasHousemates?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    wheelchairAccessible?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    smokesAtHome?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    drinkingAllowed?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    drinksAtHome?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    parking?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    campingOk?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    profileCompleted?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    pageSize: number,
    pageToken: string,
  }

  export enum SearchInCase { 
    SEARCH_IN_NOT_SET = 0,
    SEARCH_IN_AREA = 28,
    SEARCH_IN_COMMUNITY_ID = 29,
    SEARCH_IN_RECTANGLE = 33,
  }
}

export class UserSearchRes extends jspb.Message {
  getResultsList(): Array<Result>;
  setResultsList(value: Array<Result>): UserSearchRes;
  clearResultsList(): UserSearchRes;
  addResults(value?: Result, index?: number): Result;

  getNextPageToken(): string;
  setNextPageToken(value: string): UserSearchRes;

  getTotalItems(): number;
  setTotalItems(value: number): UserSearchRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UserSearchRes.AsObject;
  static toObject(includeInstance: boolean, msg: UserSearchRes): UserSearchRes.AsObject;
  static serializeBinaryToWriter(message: UserSearchRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UserSearchRes;
  static deserializeBinaryFromReader(message: UserSearchRes, reader: jspb.BinaryReader): UserSearchRes;
}

export namespace UserSearchRes {
  export type AsObject = {
    resultsList: Array<Result.AsObject>,
    nextPageToken: string,
    totalItems: number,
  }
}

export class EventSearchReq extends jspb.Message {
  getPast(): boolean;
  setPast(value: boolean): EventSearchReq;

  getQuery(): google_protobuf_wrappers_pb.StringValue | undefined;
  setQuery(value?: google_protobuf_wrappers_pb.StringValue): EventSearchReq;
  hasQuery(): boolean;
  clearQuery(): EventSearchReq;

  getQueryTitleOnly(): boolean;
  setQueryTitleOnly(value: boolean): EventSearchReq;

  getOnlyOnline(): boolean;
  setOnlyOnline(value: boolean): EventSearchReq;

  getOnlyOffline(): boolean;
  setOnlyOffline(value: boolean): EventSearchReq;

  getSubscribed(): boolean;
  setSubscribed(value: boolean): EventSearchReq;

  getAttending(): boolean;
  setAttending(value: boolean): EventSearchReq;

  getOrganizing(): boolean;
  setOrganizing(value: boolean): EventSearchReq;

  getMyCommunities(): boolean;
  setMyCommunities(value: boolean): EventSearchReq;

  getIncludeCancelled(): boolean;
  setIncludeCancelled(value: boolean): EventSearchReq;

  getSearchInArea(): Area | undefined;
  setSearchInArea(value?: Area): EventSearchReq;
  hasSearchInArea(): boolean;
  clearSearchInArea(): EventSearchReq;

  getSearchInCommunityId(): number;
  setSearchInCommunityId(value: number): EventSearchReq;

  getSearchInRectangle(): RectArea | undefined;
  setSearchInRectangle(value?: RectArea): EventSearchReq;
  hasSearchInRectangle(): boolean;
  clearSearchInRectangle(): EventSearchReq;

  getAfter(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setAfter(value?: google_protobuf_timestamp_pb.Timestamp): EventSearchReq;
  hasAfter(): boolean;
  clearAfter(): EventSearchReq;

  getBefore(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setBefore(value?: google_protobuf_timestamp_pb.Timestamp): EventSearchReq;
  hasBefore(): boolean;
  clearBefore(): EventSearchReq;

  getPageSize(): number;
  setPageSize(value: number): EventSearchReq;

  getPageToken(): string;
  setPageToken(value: string): EventSearchReq;

  getPageNumber(): number;
  setPageNumber(value: number): EventSearchReq;

  getOnlineStatusCase(): EventSearchReq.OnlineStatusCase;

  getSearchInCase(): EventSearchReq.SearchInCase;

  getPaginationCase(): EventSearchReq.PaginationCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventSearchReq.AsObject;
  static toObject(includeInstance: boolean, msg: EventSearchReq): EventSearchReq.AsObject;
  static serializeBinaryToWriter(message: EventSearchReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventSearchReq;
  static deserializeBinaryFromReader(message: EventSearchReq, reader: jspb.BinaryReader): EventSearchReq;
}

export namespace EventSearchReq {
  export type AsObject = {
    past: boolean,
    query?: google_protobuf_wrappers_pb.StringValue.AsObject,
    queryTitleOnly: boolean,
    onlyOnline: boolean,
    onlyOffline: boolean,
    subscribed: boolean,
    attending: boolean,
    organizing: boolean,
    myCommunities: boolean,
    includeCancelled: boolean,
    searchInArea?: Area.AsObject,
    searchInCommunityId: number,
    searchInRectangle?: RectArea.AsObject,
    after?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    before?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    pageSize: number,
    pageToken: string,
    pageNumber: number,
  }

  export enum OnlineStatusCase { 
    ONLINE_STATUS_NOT_SET = 0,
    ONLY_ONLINE = 12,
    ONLY_OFFLINE = 13,
  }

  export enum SearchInCase { 
    SEARCH_IN_NOT_SET = 0,
    SEARCH_IN_AREA = 5,
    SEARCH_IN_COMMUNITY_ID = 6,
    SEARCH_IN_RECTANGLE = 7,
  }

  export enum PaginationCase { 
    PAGINATION_NOT_SET = 0,
    PAGE_TOKEN = 11,
    PAGE_NUMBER = 18,
  }
}

export class EventSearchRes extends jspb.Message {
  getEventsList(): Array<events_pb.Event>;
  setEventsList(value: Array<events_pb.Event>): EventSearchRes;
  clearEventsList(): EventSearchRes;
  addEvents(value?: events_pb.Event, index?: number): events_pb.Event;

  getNextPageToken(): string;
  setNextPageToken(value: string): EventSearchRes;

  getTotalItems(): number;
  setTotalItems(value: number): EventSearchRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventSearchRes.AsObject;
  static toObject(includeInstance: boolean, msg: EventSearchRes): EventSearchRes.AsObject;
  static serializeBinaryToWriter(message: EventSearchRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventSearchRes;
  static deserializeBinaryFromReader(message: EventSearchRes, reader: jspb.BinaryReader): EventSearchRes;
}

export namespace EventSearchRes {
  export type AsObject = {
    eventsList: Array<events_pb.Event.AsObject>,
    nextPageToken: string,
    totalItems: number,
  }
}

