import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb'; // proto import: "google/protobuf/wrappers.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as requests_pb from './requests_pb'; // proto import: "requests.proto"


export class SendFriendRequestReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): SendFriendRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendFriendRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendFriendRequestReq): SendFriendRequestReq.AsObject;
  static serializeBinaryToWriter(message: SendFriendRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendFriendRequestReq;
  static deserializeBinaryFromReader(message: SendFriendRequestReq, reader: jspb.BinaryReader): SendFriendRequestReq;
}

export namespace SendFriendRequestReq {
  export type AsObject = {
    userId: number,
  }
}

export class FriendRequest extends jspb.Message {
  getFriendRequestId(): number;
  setFriendRequestId(value: number): FriendRequest;

  getState(): FriendRequest.FriendRequestStatus;
  setState(value: FriendRequest.FriendRequestStatus): FriendRequest;

  getUserId(): number;
  setUserId(value: number): FriendRequest;

  getSent(): boolean;
  setSent(value: boolean): FriendRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FriendRequest.AsObject;
  static toObject(includeInstance: boolean, msg: FriendRequest): FriendRequest.AsObject;
  static serializeBinaryToWriter(message: FriendRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FriendRequest;
  static deserializeBinaryFromReader(message: FriendRequest, reader: jspb.BinaryReader): FriendRequest;
}

export namespace FriendRequest {
  export type AsObject = {
    friendRequestId: number,
    state: FriendRequest.FriendRequestStatus,
    userId: number,
    sent: boolean,
  }

  export enum FriendRequestStatus { 
    PENDING = 0,
    ACCEPTED = 1,
  }
}

export class RespondFriendRequestReq extends jspb.Message {
  getFriendRequestId(): number;
  setFriendRequestId(value: number): RespondFriendRequestReq;

  getAccept(): boolean;
  setAccept(value: boolean): RespondFriendRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RespondFriendRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: RespondFriendRequestReq): RespondFriendRequestReq.AsObject;
  static serializeBinaryToWriter(message: RespondFriendRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RespondFriendRequestReq;
  static deserializeBinaryFromReader(message: RespondFriendRequestReq, reader: jspb.BinaryReader): RespondFriendRequestReq;
}

export namespace RespondFriendRequestReq {
  export type AsObject = {
    friendRequestId: number,
    accept: boolean,
  }
}

export class CancelFriendRequestReq extends jspb.Message {
  getFriendRequestId(): number;
  setFriendRequestId(value: number): CancelFriendRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CancelFriendRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: CancelFriendRequestReq): CancelFriendRequestReq.AsObject;
  static serializeBinaryToWriter(message: CancelFriendRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CancelFriendRequestReq;
  static deserializeBinaryFromReader(message: CancelFriendRequestReq, reader: jspb.BinaryReader): CancelFriendRequestReq;
}

export namespace CancelFriendRequestReq {
  export type AsObject = {
    friendRequestId: number,
  }
}

export class ListFriendRequestsRes extends jspb.Message {
  getSentList(): Array<FriendRequest>;
  setSentList(value: Array<FriendRequest>): ListFriendRequestsRes;
  clearSentList(): ListFriendRequestsRes;
  addSent(value?: FriendRequest, index?: number): FriendRequest;

  getReceivedList(): Array<FriendRequest>;
  setReceivedList(value: Array<FriendRequest>): ListFriendRequestsRes;
  clearReceivedList(): ListFriendRequestsRes;
  addReceived(value?: FriendRequest, index?: number): FriendRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFriendRequestsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListFriendRequestsRes): ListFriendRequestsRes.AsObject;
  static serializeBinaryToWriter(message: ListFriendRequestsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFriendRequestsRes;
  static deserializeBinaryFromReader(message: ListFriendRequestsRes, reader: jspb.BinaryReader): ListFriendRequestsRes;
}

export namespace ListFriendRequestsRes {
  export type AsObject = {
    sentList: Array<FriendRequest.AsObject>,
    receivedList: Array<FriendRequest.AsObject>,
  }
}

export class ListFriendsRes extends jspb.Message {
  getUserIdsList(): Array<number>;
  setUserIdsList(value: Array<number>): ListFriendsRes;
  clearUserIdsList(): ListFriendsRes;
  addUserIds(value: number, index?: number): ListFriendsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFriendsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListFriendsRes): ListFriendsRes.AsObject;
  static serializeBinaryToWriter(message: ListFriendsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFriendsRes;
  static deserializeBinaryFromReader(message: ListFriendsRes, reader: jspb.BinaryReader): ListFriendsRes;
}

export namespace ListFriendsRes {
  export type AsObject = {
    userIdsList: Array<number>,
  }
}

export class RemoveFriendReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): RemoveFriendReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveFriendReq.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveFriendReq): RemoveFriendReq.AsObject;
  static serializeBinaryToWriter(message: RemoveFriendReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveFriendReq;
  static deserializeBinaryFromReader(message: RemoveFriendReq, reader: jspb.BinaryReader): RemoveFriendReq;
}

export namespace RemoveFriendReq {
  export type AsObject = {
    userId: number,
  }
}

export class ListMutualFriendsReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): ListMutualFriendsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMutualFriendsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListMutualFriendsReq): ListMutualFriendsReq.AsObject;
  static serializeBinaryToWriter(message: ListMutualFriendsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMutualFriendsReq;
  static deserializeBinaryFromReader(message: ListMutualFriendsReq, reader: jspb.BinaryReader): ListMutualFriendsReq;
}

export namespace ListMutualFriendsReq {
  export type AsObject = {
    userId: number,
  }
}

export class ListMutualFriendsRes extends jspb.Message {
  getMutualFriendsList(): Array<MutualFriend>;
  setMutualFriendsList(value: Array<MutualFriend>): ListMutualFriendsRes;
  clearMutualFriendsList(): ListMutualFriendsRes;
  addMutualFriends(value?: MutualFriend, index?: number): MutualFriend;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMutualFriendsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListMutualFriendsRes): ListMutualFriendsRes.AsObject;
  static serializeBinaryToWriter(message: ListMutualFriendsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMutualFriendsRes;
  static deserializeBinaryFromReader(message: ListMutualFriendsRes, reader: jspb.BinaryReader): ListMutualFriendsRes;
}

export namespace ListMutualFriendsRes {
  export type AsObject = {
    mutualFriendsList: Array<MutualFriend.AsObject>,
  }
}

export class PingReq extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingReq.AsObject;
  static toObject(includeInstance: boolean, msg: PingReq): PingReq.AsObject;
  static serializeBinaryToWriter(message: PingReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PingReq;
  static deserializeBinaryFromReader(message: PingReq, reader: jspb.BinaryReader): PingReq;
}

export namespace PingReq {
  export type AsObject = {
  }
}

export class PingRes extends jspb.Message {
  getUser(): User | undefined;
  setUser(value?: User): PingRes;
  hasUser(): boolean;
  clearUser(): PingRes;

  getUnseenMessageCount(): number;
  setUnseenMessageCount(value: number): PingRes;

  getUnseenSentHostRequestCount(): number;
  setUnseenSentHostRequestCount(value: number): PingRes;

  getUnseenReceivedHostRequestCount(): number;
  setUnseenReceivedHostRequestCount(value: number): PingRes;

  getPendingFriendRequestCount(): number;
  setPendingFriendRequestCount(value: number): PingRes;

  getUnseenNotificationCount(): number;
  setUnseenNotificationCount(value: number): PingRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingRes.AsObject;
  static toObject(includeInstance: boolean, msg: PingRes): PingRes.AsObject;
  static serializeBinaryToWriter(message: PingRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PingRes;
  static deserializeBinaryFromReader(message: PingRes, reader: jspb.BinaryReader): PingRes;
}

export namespace PingRes {
  export type AsObject = {
    user?: User.AsObject,
    unseenMessageCount: number,
    unseenSentHostRequestCount: number,
    unseenReceivedHostRequestCount: number,
    pendingFriendRequestCount: number,
    unseenNotificationCount: number,
  }
}

export class MutualFriend extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): MutualFriend;

  getUsername(): string;
  setUsername(value: string): MutualFriend;

  getName(): string;
  setName(value: string): MutualFriend;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MutualFriend.AsObject;
  static toObject(includeInstance: boolean, msg: MutualFriend): MutualFriend.AsObject;
  static serializeBinaryToWriter(message: MutualFriend, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MutualFriend;
  static deserializeBinaryFromReader(message: MutualFriend, reader: jspb.BinaryReader): MutualFriend;
}

export namespace MutualFriend {
  export type AsObject = {
    userId: number,
    username: string,
    name: string,
  }
}

export class LanguageAbility extends jspb.Message {
  getCode(): string;
  setCode(value: string): LanguageAbility;

  getFluency(): LanguageAbility.Fluency;
  setFluency(value: LanguageAbility.Fluency): LanguageAbility;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LanguageAbility.AsObject;
  static toObject(includeInstance: boolean, msg: LanguageAbility): LanguageAbility.AsObject;
  static serializeBinaryToWriter(message: LanguageAbility, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LanguageAbility;
  static deserializeBinaryFromReader(message: LanguageAbility, reader: jspb.BinaryReader): LanguageAbility;
}

export namespace LanguageAbility {
  export type AsObject = {
    code: string,
    fluency: LanguageAbility.Fluency,
  }

  export enum Fluency { 
    FLUENCY_UNKNOWN = 0,
    FLUENCY_BEGINNER = 1,
    FLUENCY_CONVERSATIONAL = 2,
    FLUENCY_FLUENT = 3,
  }
}

export class NullableUInt32Value extends jspb.Message {
  getIsNull(): boolean;
  setIsNull(value: boolean): NullableUInt32Value;

  getValue(): number;
  setValue(value: number): NullableUInt32Value;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NullableUInt32Value.AsObject;
  static toObject(includeInstance: boolean, msg: NullableUInt32Value): NullableUInt32Value.AsObject;
  static serializeBinaryToWriter(message: NullableUInt32Value, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NullableUInt32Value;
  static deserializeBinaryFromReader(message: NullableUInt32Value, reader: jspb.BinaryReader): NullableUInt32Value;
}

export namespace NullableUInt32Value {
  export type AsObject = {
    isNull: boolean,
    value: number,
  }
}

export class NullableBoolValue extends jspb.Message {
  getIsNull(): boolean;
  setIsNull(value: boolean): NullableBoolValue;

  getValue(): boolean;
  setValue(value: boolean): NullableBoolValue;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NullableBoolValue.AsObject;
  static toObject(includeInstance: boolean, msg: NullableBoolValue): NullableBoolValue.AsObject;
  static serializeBinaryToWriter(message: NullableBoolValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NullableBoolValue;
  static deserializeBinaryFromReader(message: NullableBoolValue, reader: jspb.BinaryReader): NullableBoolValue;
}

export namespace NullableBoolValue {
  export type AsObject = {
    isNull: boolean,
    value: boolean,
  }
}

export class NullableStringValue extends jspb.Message {
  getIsNull(): boolean;
  setIsNull(value: boolean): NullableStringValue;

  getValue(): string;
  setValue(value: string): NullableStringValue;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NullableStringValue.AsObject;
  static toObject(includeInstance: boolean, msg: NullableStringValue): NullableStringValue.AsObject;
  static serializeBinaryToWriter(message: NullableStringValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NullableStringValue;
  static deserializeBinaryFromReader(message: NullableStringValue, reader: jspb.BinaryReader): NullableStringValue;
}

export namespace NullableStringValue {
  export type AsObject = {
    isNull: boolean,
    value: string,
  }
}

export class User extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): User;

  getUsername(): string;
  setUsername(value: string): User;

  getName(): string;
  setName(value: string): User;

  getCity(): string;
  setCity(value: string): User;

  getHometown(): string;
  setHometown(value: string): User;

  getTimezone(): string;
  setTimezone(value: string): User;

  getLat(): number;
  setLat(value: number): User;

  getLng(): number;
  setLng(value: number): User;

  getRadius(): number;
  setRadius(value: number): User;

  getVerification(): number;
  setVerification(value: number): User;

  getCommunityStanding(): number;
  setCommunityStanding(value: number): User;

  getNumReferences(): number;
  setNumReferences(value: number): User;

  getGender(): string;
  setGender(value: string): User;

  getPronouns(): string;
  setPronouns(value: string): User;

  getAge(): number;
  setAge(value: number): User;

  getJoined(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setJoined(value?: google_protobuf_timestamp_pb.Timestamp): User;
  hasJoined(): boolean;
  clearJoined(): User;

  getLastActive(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastActive(value?: google_protobuf_timestamp_pb.Timestamp): User;
  hasLastActive(): boolean;
  clearLastActive(): User;

  getHostingStatus(): HostingStatus;
  setHostingStatus(value: HostingStatus): User;

  getMeetupStatus(): MeetupStatus;
  setMeetupStatus(value: MeetupStatus): User;

  getOccupation(): string;
  setOccupation(value: string): User;

  getEducation(): string;
  setEducation(value: string): User;

  getAboutMe(): string;
  setAboutMe(value: string): User;

  getThingsILike(): string;
  setThingsILike(value: string): User;

  getAboutPlace(): string;
  setAboutPlace(value: string): User;

  getRegionsVisitedList(): Array<string>;
  setRegionsVisitedList(value: Array<string>): User;
  clearRegionsVisitedList(): User;
  addRegionsVisited(value: string, index?: number): User;

  getRegionsLivedList(): Array<string>;
  setRegionsLivedList(value: Array<string>): User;
  clearRegionsLivedList(): User;
  addRegionsLived(value: string, index?: number): User;

  getAdditionalInformation(): string;
  setAdditionalInformation(value: string): User;

  getFriends(): User.FriendshipStatus;
  setFriends(value: User.FriendshipStatus): User;

  getPendingFriendRequest(): FriendRequest | undefined;
  setPendingFriendRequest(value?: FriendRequest): User;
  hasPendingFriendRequest(): boolean;
  clearPendingFriendRequest(): User;

  getMaxGuests(): google_protobuf_wrappers_pb.UInt32Value | undefined;
  setMaxGuests(value?: google_protobuf_wrappers_pb.UInt32Value): User;
  hasMaxGuests(): boolean;
  clearMaxGuests(): User;

  getLastMinute(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setLastMinute(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasLastMinute(): boolean;
  clearLastMinute(): User;

  getHasPets(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setHasPets(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasHasPets(): boolean;
  clearHasPets(): User;

  getAcceptsPets(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setAcceptsPets(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasAcceptsPets(): boolean;
  clearAcceptsPets(): User;

  getPetDetails(): google_protobuf_wrappers_pb.StringValue | undefined;
  setPetDetails(value?: google_protobuf_wrappers_pb.StringValue): User;
  hasPetDetails(): boolean;
  clearPetDetails(): User;

  getHasKids(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setHasKids(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasHasKids(): boolean;
  clearHasKids(): User;

  getAcceptsKids(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setAcceptsKids(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasAcceptsKids(): boolean;
  clearAcceptsKids(): User;

  getKidDetails(): google_protobuf_wrappers_pb.StringValue | undefined;
  setKidDetails(value?: google_protobuf_wrappers_pb.StringValue): User;
  hasKidDetails(): boolean;
  clearKidDetails(): User;

  getHasHousemates(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setHasHousemates(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasHasHousemates(): boolean;
  clearHasHousemates(): User;

  getHousemateDetails(): google_protobuf_wrappers_pb.StringValue | undefined;
  setHousemateDetails(value?: google_protobuf_wrappers_pb.StringValue): User;
  hasHousemateDetails(): boolean;
  clearHousemateDetails(): User;

  getWheelchairAccessible(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setWheelchairAccessible(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasWheelchairAccessible(): boolean;
  clearWheelchairAccessible(): User;

  getSmokingAllowed(): SmokingLocation;
  setSmokingAllowed(value: SmokingLocation): User;

  getSmokesAtHome(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setSmokesAtHome(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasSmokesAtHome(): boolean;
  clearSmokesAtHome(): User;

  getDrinkingAllowed(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setDrinkingAllowed(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasDrinkingAllowed(): boolean;
  clearDrinkingAllowed(): User;

  getDrinksAtHome(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setDrinksAtHome(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasDrinksAtHome(): boolean;
  clearDrinksAtHome(): User;

  getOtherHostInfo(): google_protobuf_wrappers_pb.StringValue | undefined;
  setOtherHostInfo(value?: google_protobuf_wrappers_pb.StringValue): User;
  hasOtherHostInfo(): boolean;
  clearOtherHostInfo(): User;

  getSleepingArrangement(): SleepingArrangement;
  setSleepingArrangement(value: SleepingArrangement): User;

  getSleepingDetails(): google_protobuf_wrappers_pb.StringValue | undefined;
  setSleepingDetails(value?: google_protobuf_wrappers_pb.StringValue): User;
  hasSleepingDetails(): boolean;
  clearSleepingDetails(): User;

  getArea(): google_protobuf_wrappers_pb.StringValue | undefined;
  setArea(value?: google_protobuf_wrappers_pb.StringValue): User;
  hasArea(): boolean;
  clearArea(): User;

  getHouseRules(): google_protobuf_wrappers_pb.StringValue | undefined;
  setHouseRules(value?: google_protobuf_wrappers_pb.StringValue): User;
  hasHouseRules(): boolean;
  clearHouseRules(): User;

  getParking(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setParking(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasParking(): boolean;
  clearParking(): User;

  getParkingDetails(): ParkingDetails;
  setParkingDetails(value: ParkingDetails): User;

  getCampingOk(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setCampingOk(value?: google_protobuf_wrappers_pb.BoolValue): User;
  hasCampingOk(): boolean;
  clearCampingOk(): User;

  getAvatarUrl(): string;
  setAvatarUrl(value: string): User;

  getAvatarThumbnailUrl(): string;
  setAvatarThumbnailUrl(value: string): User;

  getLanguageAbilitiesList(): Array<LanguageAbility>;
  setLanguageAbilitiesList(value: Array<LanguageAbility>): User;
  clearLanguageAbilitiesList(): User;
  addLanguageAbilities(value?: LanguageAbility, index?: number): LanguageAbility;

  getBadgesList(): Array<string>;
  setBadgesList(value: Array<string>): User;
  clearBadgesList(): User;
  addBadges(value: string, index?: number): User;

  getHasStrongVerification(): boolean;
  setHasStrongVerification(value: boolean): User;

  getBirthdateVerificationStatus(): BirthdateVerificationStatus;
  setBirthdateVerificationStatus(value: BirthdateVerificationStatus): User;

  getGenderVerificationStatus(): GenderVerificationStatus;
  setGenderVerificationStatus(value: GenderVerificationStatus): User;

  getInsufficientData(): requests_pb.ResponseRateInsufficientData | undefined;
  setInsufficientData(value?: requests_pb.ResponseRateInsufficientData): User;
  hasInsufficientData(): boolean;
  clearInsufficientData(): User;

  getLow(): requests_pb.ResponseRateLow | undefined;
  setLow(value?: requests_pb.ResponseRateLow): User;
  hasLow(): boolean;
  clearLow(): User;

  getSome(): requests_pb.ResponseRateSome | undefined;
  setSome(value?: requests_pb.ResponseRateSome): User;
  hasSome(): boolean;
  clearSome(): User;

  getMost(): requests_pb.ResponseRateMost | undefined;
  setMost(value?: requests_pb.ResponseRateMost): User;
  hasMost(): boolean;
  clearMost(): User;

  getAlmostAll(): requests_pb.ResponseRateAlmostAll | undefined;
  setAlmostAll(value?: requests_pb.ResponseRateAlmostAll): User;
  hasAlmostAll(): boolean;
  clearAlmostAll(): User;

  getResponseRateCase(): User.ResponseRateCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): User.AsObject;
  static toObject(includeInstance: boolean, msg: User): User.AsObject;
  static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): User;
  static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
  export type AsObject = {
    userId: number,
    username: string,
    name: string,
    city: string,
    hometown: string,
    timezone: string,
    lat: number,
    lng: number,
    radius: number,
    verification: number,
    communityStanding: number,
    numReferences: number,
    gender: string,
    pronouns: string,
    age: number,
    joined?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastActive?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    hostingStatus: HostingStatus,
    meetupStatus: MeetupStatus,
    occupation: string,
    education: string,
    aboutMe: string,
    thingsILike: string,
    aboutPlace: string,
    regionsVisitedList: Array<string>,
    regionsLivedList: Array<string>,
    additionalInformation: string,
    friends: User.FriendshipStatus,
    pendingFriendRequest?: FriendRequest.AsObject,
    maxGuests?: google_protobuf_wrappers_pb.UInt32Value.AsObject,
    lastMinute?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    hasPets?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    acceptsPets?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    petDetails?: google_protobuf_wrappers_pb.StringValue.AsObject,
    hasKids?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    acceptsKids?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    kidDetails?: google_protobuf_wrappers_pb.StringValue.AsObject,
    hasHousemates?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    housemateDetails?: google_protobuf_wrappers_pb.StringValue.AsObject,
    wheelchairAccessible?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    smokingAllowed: SmokingLocation,
    smokesAtHome?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    drinkingAllowed?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    drinksAtHome?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    otherHostInfo?: google_protobuf_wrappers_pb.StringValue.AsObject,
    sleepingArrangement: SleepingArrangement,
    sleepingDetails?: google_protobuf_wrappers_pb.StringValue.AsObject,
    area?: google_protobuf_wrappers_pb.StringValue.AsObject,
    houseRules?: google_protobuf_wrappers_pb.StringValue.AsObject,
    parking?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    parkingDetails: ParkingDetails,
    campingOk?: google_protobuf_wrappers_pb.BoolValue.AsObject,
    avatarUrl: string,
    avatarThumbnailUrl: string,
    languageAbilitiesList: Array<LanguageAbility.AsObject>,
    badgesList: Array<string>,
    hasStrongVerification: boolean,
    birthdateVerificationStatus: BirthdateVerificationStatus,
    genderVerificationStatus: GenderVerificationStatus,
    insufficientData?: requests_pb.ResponseRateInsufficientData.AsObject,
    low?: requests_pb.ResponseRateLow.AsObject,
    some?: requests_pb.ResponseRateSome.AsObject,
    most?: requests_pb.ResponseRateMost.AsObject,
    almostAll?: requests_pb.ResponseRateAlmostAll.AsObject,
  }

  export enum FriendshipStatus { 
    NOT_FRIENDS = 0,
    FRIENDS = 1,
    PENDING = 2,
    NA = 3,
  }

  export enum ResponseRateCase { 
    RESPONSE_RATE_NOT_SET = 0,
    INSUFFICIENT_DATA = 51,
    LOW = 52,
    SOME = 53,
    MOST = 54,
    ALMOST_ALL = 55,
  }
}

export class GetUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetUserReq): GetUserReq.AsObject;
  static serializeBinaryToWriter(message: GetUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUserReq;
  static deserializeBinaryFromReader(message: GetUserReq, reader: jspb.BinaryReader): GetUserReq;
}

export namespace GetUserReq {
  export type AsObject = {
    user: string,
  }
}

export class LiteUser extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): LiteUser;

  getUsername(): string;
  setUsername(value: string): LiteUser;

  getName(): string;
  setName(value: string): LiteUser;

  getCity(): string;
  setCity(value: string): LiteUser;

  getAge(): number;
  setAge(value: number): LiteUser;

  getAvatarUrl(): string;
  setAvatarUrl(value: string): LiteUser;

  getAvatarThumbnailUrl(): string;
  setAvatarThumbnailUrl(value: string): LiteUser;

  getLat(): number;
  setLat(value: number): LiteUser;

  getLng(): number;
  setLng(value: number): LiteUser;

  getRadius(): number;
  setRadius(value: number): LiteUser;

  getHasStrongVerification(): boolean;
  setHasStrongVerification(value: boolean): LiteUser;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LiteUser.AsObject;
  static toObject(includeInstance: boolean, msg: LiteUser): LiteUser.AsObject;
  static serializeBinaryToWriter(message: LiteUser, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LiteUser;
  static deserializeBinaryFromReader(message: LiteUser, reader: jspb.BinaryReader): LiteUser;
}

export namespace LiteUser {
  export type AsObject = {
    userId: number,
    username: string,
    name: string,
    city: string,
    age: number,
    avatarUrl: string,
    avatarThumbnailUrl: string,
    lat: number,
    lng: number,
    radius: number,
    hasStrongVerification: boolean,
  }
}

export class GetLiteUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetLiteUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetLiteUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetLiteUserReq): GetLiteUserReq.AsObject;
  static serializeBinaryToWriter(message: GetLiteUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetLiteUserReq;
  static deserializeBinaryFromReader(message: GetLiteUserReq, reader: jspb.BinaryReader): GetLiteUserReq;
}

export namespace GetLiteUserReq {
  export type AsObject = {
    user: string,
  }
}

export class GetLiteUsersReq extends jspb.Message {
  getUsersList(): Array<string>;
  setUsersList(value: Array<string>): GetLiteUsersReq;
  clearUsersList(): GetLiteUsersReq;
  addUsers(value: string, index?: number): GetLiteUsersReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetLiteUsersReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetLiteUsersReq): GetLiteUsersReq.AsObject;
  static serializeBinaryToWriter(message: GetLiteUsersReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetLiteUsersReq;
  static deserializeBinaryFromReader(message: GetLiteUsersReq, reader: jspb.BinaryReader): GetLiteUsersReq;
}

export namespace GetLiteUsersReq {
  export type AsObject = {
    usersList: Array<string>,
  }
}

export class LiteUserRes extends jspb.Message {
  getQuery(): string;
  setQuery(value: string): LiteUserRes;

  getUser(): LiteUser | undefined;
  setUser(value?: LiteUser): LiteUserRes;
  hasUser(): boolean;
  clearUser(): LiteUserRes;

  getNotFound(): boolean;
  setNotFound(value: boolean): LiteUserRes;

  getRespCase(): LiteUserRes.RespCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LiteUserRes.AsObject;
  static toObject(includeInstance: boolean, msg: LiteUserRes): LiteUserRes.AsObject;
  static serializeBinaryToWriter(message: LiteUserRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LiteUserRes;
  static deserializeBinaryFromReader(message: LiteUserRes, reader: jspb.BinaryReader): LiteUserRes;
}

export namespace LiteUserRes {
  export type AsObject = {
    query: string,
    user?: LiteUser.AsObject,
    notFound: boolean,
  }

  export enum RespCase { 
    RESP_NOT_SET = 0,
    USER = 2,
    NOT_FOUND = 3,
  }
}

export class GetLiteUsersRes extends jspb.Message {
  getResponsesList(): Array<LiteUserRes>;
  setResponsesList(value: Array<LiteUserRes>): GetLiteUsersRes;
  clearResponsesList(): GetLiteUsersRes;
  addResponses(value?: LiteUserRes, index?: number): LiteUserRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetLiteUsersRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetLiteUsersRes): GetLiteUsersRes.AsObject;
  static serializeBinaryToWriter(message: GetLiteUsersRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetLiteUsersRes;
  static deserializeBinaryFromReader(message: GetLiteUsersRes, reader: jspb.BinaryReader): GetLiteUsersRes;
}

export namespace GetLiteUsersRes {
  export type AsObject = {
    responsesList: Array<LiteUserRes.AsObject>,
  }
}

export class RepeatedStringValue extends jspb.Message {
  getValueList(): Array<string>;
  setValueList(value: Array<string>): RepeatedStringValue;
  clearValueList(): RepeatedStringValue;
  addValue(value: string, index?: number): RepeatedStringValue;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RepeatedStringValue.AsObject;
  static toObject(includeInstance: boolean, msg: RepeatedStringValue): RepeatedStringValue.AsObject;
  static serializeBinaryToWriter(message: RepeatedStringValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RepeatedStringValue;
  static deserializeBinaryFromReader(message: RepeatedStringValue, reader: jspb.BinaryReader): RepeatedStringValue;
}

export namespace RepeatedStringValue {
  export type AsObject = {
    valueList: Array<string>,
  }
}

export class RepeatedLanguageAbilityValue extends jspb.Message {
  getValueList(): Array<LanguageAbility>;
  setValueList(value: Array<LanguageAbility>): RepeatedLanguageAbilityValue;
  clearValueList(): RepeatedLanguageAbilityValue;
  addValue(value?: LanguageAbility, index?: number): LanguageAbility;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RepeatedLanguageAbilityValue.AsObject;
  static toObject(includeInstance: boolean, msg: RepeatedLanguageAbilityValue): RepeatedLanguageAbilityValue.AsObject;
  static serializeBinaryToWriter(message: RepeatedLanguageAbilityValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RepeatedLanguageAbilityValue;
  static deserializeBinaryFromReader(message: RepeatedLanguageAbilityValue, reader: jspb.BinaryReader): RepeatedLanguageAbilityValue;
}

export namespace RepeatedLanguageAbilityValue {
  export type AsObject = {
    valueList: Array<LanguageAbility.AsObject>,
  }
}

export class UpdateProfileReq extends jspb.Message {
  getName(): google_protobuf_wrappers_pb.StringValue | undefined;
  setName(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasName(): boolean;
  clearName(): UpdateProfileReq;

  getCity(): google_protobuf_wrappers_pb.StringValue | undefined;
  setCity(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasCity(): boolean;
  clearCity(): UpdateProfileReq;

  getHometown(): NullableStringValue | undefined;
  setHometown(value?: NullableStringValue): UpdateProfileReq;
  hasHometown(): boolean;
  clearHometown(): UpdateProfileReq;

  getLat(): google_protobuf_wrappers_pb.DoubleValue | undefined;
  setLat(value?: google_protobuf_wrappers_pb.DoubleValue): UpdateProfileReq;
  hasLat(): boolean;
  clearLat(): UpdateProfileReq;

  getLng(): google_protobuf_wrappers_pb.DoubleValue | undefined;
  setLng(value?: google_protobuf_wrappers_pb.DoubleValue): UpdateProfileReq;
  hasLng(): boolean;
  clearLng(): UpdateProfileReq;

  getRadius(): google_protobuf_wrappers_pb.DoubleValue | undefined;
  setRadius(value?: google_protobuf_wrappers_pb.DoubleValue): UpdateProfileReq;
  hasRadius(): boolean;
  clearRadius(): UpdateProfileReq;

  getAvatarKey(): NullableStringValue | undefined;
  setAvatarKey(value?: NullableStringValue): UpdateProfileReq;
  hasAvatarKey(): boolean;
  clearAvatarKey(): UpdateProfileReq;

  getPronouns(): NullableStringValue | undefined;
  setPronouns(value?: NullableStringValue): UpdateProfileReq;
  hasPronouns(): boolean;
  clearPronouns(): UpdateProfileReq;

  getOccupation(): NullableStringValue | undefined;
  setOccupation(value?: NullableStringValue): UpdateProfileReq;
  hasOccupation(): boolean;
  clearOccupation(): UpdateProfileReq;

  getEducation(): NullableStringValue | undefined;
  setEducation(value?: NullableStringValue): UpdateProfileReq;
  hasEducation(): boolean;
  clearEducation(): UpdateProfileReq;

  getAboutMe(): NullableStringValue | undefined;
  setAboutMe(value?: NullableStringValue): UpdateProfileReq;
  hasAboutMe(): boolean;
  clearAboutMe(): UpdateProfileReq;

  getThingsILike(): NullableStringValue | undefined;
  setThingsILike(value?: NullableStringValue): UpdateProfileReq;
  hasThingsILike(): boolean;
  clearThingsILike(): UpdateProfileReq;

  getAboutPlace(): NullableStringValue | undefined;
  setAboutPlace(value?: NullableStringValue): UpdateProfileReq;
  hasAboutPlace(): boolean;
  clearAboutPlace(): UpdateProfileReq;

  getHostingStatus(): HostingStatus;
  setHostingStatus(value: HostingStatus): UpdateProfileReq;

  getMeetupStatus(): MeetupStatus;
  setMeetupStatus(value: MeetupStatus): UpdateProfileReq;

  getRegionsVisited(): RepeatedStringValue | undefined;
  setRegionsVisited(value?: RepeatedStringValue): UpdateProfileReq;
  hasRegionsVisited(): boolean;
  clearRegionsVisited(): UpdateProfileReq;

  getRegionsLived(): RepeatedStringValue | undefined;
  setRegionsLived(value?: RepeatedStringValue): UpdateProfileReq;
  hasRegionsLived(): boolean;
  clearRegionsLived(): UpdateProfileReq;

  getAdditionalInformation(): NullableStringValue | undefined;
  setAdditionalInformation(value?: NullableStringValue): UpdateProfileReq;
  hasAdditionalInformation(): boolean;
  clearAdditionalInformation(): UpdateProfileReq;

  getMaxGuests(): NullableUInt32Value | undefined;
  setMaxGuests(value?: NullableUInt32Value): UpdateProfileReq;
  hasMaxGuests(): boolean;
  clearMaxGuests(): UpdateProfileReq;

  getLastMinute(): NullableBoolValue | undefined;
  setLastMinute(value?: NullableBoolValue): UpdateProfileReq;
  hasLastMinute(): boolean;
  clearLastMinute(): UpdateProfileReq;

  getHasPets(): NullableBoolValue | undefined;
  setHasPets(value?: NullableBoolValue): UpdateProfileReq;
  hasHasPets(): boolean;
  clearHasPets(): UpdateProfileReq;

  getAcceptsPets(): NullableBoolValue | undefined;
  setAcceptsPets(value?: NullableBoolValue): UpdateProfileReq;
  hasAcceptsPets(): boolean;
  clearAcceptsPets(): UpdateProfileReq;

  getPetDetails(): NullableStringValue | undefined;
  setPetDetails(value?: NullableStringValue): UpdateProfileReq;
  hasPetDetails(): boolean;
  clearPetDetails(): UpdateProfileReq;

  getHasKids(): NullableBoolValue | undefined;
  setHasKids(value?: NullableBoolValue): UpdateProfileReq;
  hasHasKids(): boolean;
  clearHasKids(): UpdateProfileReq;

  getAcceptsKids(): NullableBoolValue | undefined;
  setAcceptsKids(value?: NullableBoolValue): UpdateProfileReq;
  hasAcceptsKids(): boolean;
  clearAcceptsKids(): UpdateProfileReq;

  getKidDetails(): NullableStringValue | undefined;
  setKidDetails(value?: NullableStringValue): UpdateProfileReq;
  hasKidDetails(): boolean;
  clearKidDetails(): UpdateProfileReq;

  getHasHousemates(): NullableBoolValue | undefined;
  setHasHousemates(value?: NullableBoolValue): UpdateProfileReq;
  hasHasHousemates(): boolean;
  clearHasHousemates(): UpdateProfileReq;

  getHousemateDetails(): NullableStringValue | undefined;
  setHousemateDetails(value?: NullableStringValue): UpdateProfileReq;
  hasHousemateDetails(): boolean;
  clearHousemateDetails(): UpdateProfileReq;

  getWheelchairAccessible(): NullableBoolValue | undefined;
  setWheelchairAccessible(value?: NullableBoolValue): UpdateProfileReq;
  hasWheelchairAccessible(): boolean;
  clearWheelchairAccessible(): UpdateProfileReq;

  getSmokingAllowed(): SmokingLocation;
  setSmokingAllowed(value: SmokingLocation): UpdateProfileReq;

  getSmokesAtHome(): NullableBoolValue | undefined;
  setSmokesAtHome(value?: NullableBoolValue): UpdateProfileReq;
  hasSmokesAtHome(): boolean;
  clearSmokesAtHome(): UpdateProfileReq;

  getDrinkingAllowed(): NullableBoolValue | undefined;
  setDrinkingAllowed(value?: NullableBoolValue): UpdateProfileReq;
  hasDrinkingAllowed(): boolean;
  clearDrinkingAllowed(): UpdateProfileReq;

  getDrinksAtHome(): NullableBoolValue | undefined;
  setDrinksAtHome(value?: NullableBoolValue): UpdateProfileReq;
  hasDrinksAtHome(): boolean;
  clearDrinksAtHome(): UpdateProfileReq;

  getOtherHostInfo(): NullableStringValue | undefined;
  setOtherHostInfo(value?: NullableStringValue): UpdateProfileReq;
  hasOtherHostInfo(): boolean;
  clearOtherHostInfo(): UpdateProfileReq;

  getSleepingArrangement(): SleepingArrangement;
  setSleepingArrangement(value: SleepingArrangement): UpdateProfileReq;

  getSleepingDetails(): NullableStringValue | undefined;
  setSleepingDetails(value?: NullableStringValue): UpdateProfileReq;
  hasSleepingDetails(): boolean;
  clearSleepingDetails(): UpdateProfileReq;

  getArea(): NullableStringValue | undefined;
  setArea(value?: NullableStringValue): UpdateProfileReq;
  hasArea(): boolean;
  clearArea(): UpdateProfileReq;

  getHouseRules(): NullableStringValue | undefined;
  setHouseRules(value?: NullableStringValue): UpdateProfileReq;
  hasHouseRules(): boolean;
  clearHouseRules(): UpdateProfileReq;

  getParking(): NullableBoolValue | undefined;
  setParking(value?: NullableBoolValue): UpdateProfileReq;
  hasParking(): boolean;
  clearParking(): UpdateProfileReq;

  getParkingDetails(): ParkingDetails;
  setParkingDetails(value: ParkingDetails): UpdateProfileReq;

  getCampingOk(): NullableBoolValue | undefined;
  setCampingOk(value?: NullableBoolValue): UpdateProfileReq;
  hasCampingOk(): boolean;
  clearCampingOk(): UpdateProfileReq;

  getLanguageAbilities(): RepeatedLanguageAbilityValue | undefined;
  setLanguageAbilities(value?: RepeatedLanguageAbilityValue): UpdateProfileReq;
  hasLanguageAbilities(): boolean;
  clearLanguageAbilities(): UpdateProfileReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateProfileReq.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateProfileReq): UpdateProfileReq.AsObject;
  static serializeBinaryToWriter(message: UpdateProfileReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateProfileReq;
  static deserializeBinaryFromReader(message: UpdateProfileReq, reader: jspb.BinaryReader): UpdateProfileReq;
}

export namespace UpdateProfileReq {
  export type AsObject = {
    name?: google_protobuf_wrappers_pb.StringValue.AsObject,
    city?: google_protobuf_wrappers_pb.StringValue.AsObject,
    hometown?: NullableStringValue.AsObject,
    lat?: google_protobuf_wrappers_pb.DoubleValue.AsObject,
    lng?: google_protobuf_wrappers_pb.DoubleValue.AsObject,
    radius?: google_protobuf_wrappers_pb.DoubleValue.AsObject,
    avatarKey?: NullableStringValue.AsObject,
    pronouns?: NullableStringValue.AsObject,
    occupation?: NullableStringValue.AsObject,
    education?: NullableStringValue.AsObject,
    aboutMe?: NullableStringValue.AsObject,
    thingsILike?: NullableStringValue.AsObject,
    aboutPlace?: NullableStringValue.AsObject,
    hostingStatus: HostingStatus,
    meetupStatus: MeetupStatus,
    regionsVisited?: RepeatedStringValue.AsObject,
    regionsLived?: RepeatedStringValue.AsObject,
    additionalInformation?: NullableStringValue.AsObject,
    maxGuests?: NullableUInt32Value.AsObject,
    lastMinute?: NullableBoolValue.AsObject,
    hasPets?: NullableBoolValue.AsObject,
    acceptsPets?: NullableBoolValue.AsObject,
    petDetails?: NullableStringValue.AsObject,
    hasKids?: NullableBoolValue.AsObject,
    acceptsKids?: NullableBoolValue.AsObject,
    kidDetails?: NullableStringValue.AsObject,
    hasHousemates?: NullableBoolValue.AsObject,
    housemateDetails?: NullableStringValue.AsObject,
    wheelchairAccessible?: NullableBoolValue.AsObject,
    smokingAllowed: SmokingLocation,
    smokesAtHome?: NullableBoolValue.AsObject,
    drinkingAllowed?: NullableBoolValue.AsObject,
    drinksAtHome?: NullableBoolValue.AsObject,
    otherHostInfo?: NullableStringValue.AsObject,
    sleepingArrangement: SleepingArrangement,
    sleepingDetails?: NullableStringValue.AsObject,
    area?: NullableStringValue.AsObject,
    houseRules?: NullableStringValue.AsObject,
    parking?: NullableBoolValue.AsObject,
    parkingDetails: ParkingDetails,
    campingOk?: NullableBoolValue.AsObject,
    languageAbilities?: RepeatedLanguageAbilityValue.AsObject,
  }
}

export class InitiateMediaUploadRes extends jspb.Message {
  getUploadUrl(): string;
  setUploadUrl(value: string): InitiateMediaUploadRes;

  getExpiry(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setExpiry(value?: google_protobuf_timestamp_pb.Timestamp): InitiateMediaUploadRes;
  hasExpiry(): boolean;
  clearExpiry(): InitiateMediaUploadRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InitiateMediaUploadRes.AsObject;
  static toObject(includeInstance: boolean, msg: InitiateMediaUploadRes): InitiateMediaUploadRes.AsObject;
  static serializeBinaryToWriter(message: InitiateMediaUploadRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InitiateMediaUploadRes;
  static deserializeBinaryFromReader(message: InitiateMediaUploadRes, reader: jspb.BinaryReader): InitiateMediaUploadRes;
}

export namespace InitiateMediaUploadRes {
  export type AsObject = {
    uploadUrl: string,
    expiry?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ListBadgeUsersReq extends jspb.Message {
  getBadgeId(): string;
  setBadgeId(value: string): ListBadgeUsersReq;

  getPageSize(): number;
  setPageSize(value: number): ListBadgeUsersReq;

  getPageToken(): string;
  setPageToken(value: string): ListBadgeUsersReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListBadgeUsersReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListBadgeUsersReq): ListBadgeUsersReq.AsObject;
  static serializeBinaryToWriter(message: ListBadgeUsersReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListBadgeUsersReq;
  static deserializeBinaryFromReader(message: ListBadgeUsersReq, reader: jspb.BinaryReader): ListBadgeUsersReq;
}

export namespace ListBadgeUsersReq {
  export type AsObject = {
    badgeId: string,
    pageSize: number,
    pageToken: string,
  }
}

export class ListBadgeUsersRes extends jspb.Message {
  getUserIdsList(): Array<number>;
  setUserIdsList(value: Array<number>): ListBadgeUsersRes;
  clearUserIdsList(): ListBadgeUsersRes;
  addUserIds(value: number, index?: number): ListBadgeUsersRes;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListBadgeUsersRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListBadgeUsersRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListBadgeUsersRes): ListBadgeUsersRes.AsObject;
  static serializeBinaryToWriter(message: ListBadgeUsersRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListBadgeUsersRes;
  static deserializeBinaryFromReader(message: ListBadgeUsersRes, reader: jspb.BinaryReader): ListBadgeUsersRes;
}

export namespace ListBadgeUsersRes {
  export type AsObject = {
    userIdsList: Array<number>,
    nextPageToken: string,
  }
}

export enum HostingStatus { 
  HOSTING_STATUS_UNSPECIFIED = 0,
  HOSTING_STATUS_UNKNOWN = 1,
  HOSTING_STATUS_CAN_HOST = 2,
  HOSTING_STATUS_MAYBE = 3,
  HOSTING_STATUS_CANT_HOST = 4,
}
export enum MeetupStatus { 
  MEETUP_STATUS_UNSPECIFIED = 0,
  MEETUP_STATUS_UNKNOWN = 1,
  MEETUP_STATUS_WANTS_TO_MEETUP = 2,
  MEETUP_STATUS_OPEN_TO_MEETUP = 3,
  MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP = 4,
}
export enum SmokingLocation { 
  SMOKING_LOCATION_UNSPECIFIED = 0,
  SMOKING_LOCATION_UNKNOWN = 1,
  SMOKING_LOCATION_YES = 2,
  SMOKING_LOCATION_WINDOW = 3,
  SMOKING_LOCATION_OUTSIDE = 4,
  SMOKING_LOCATION_NO = 5,
}
export enum SleepingArrangement { 
  SLEEPING_ARRANGEMENT_UNSPECIFIED = 0,
  SLEEPING_ARRANGEMENT_UNKNOWN = 1,
  SLEEPING_ARRANGEMENT_PRIVATE = 2,
  SLEEPING_ARRANGEMENT_COMMON = 3,
  SLEEPING_ARRANGEMENT_SHARED_ROOM = 4,
}
export enum ParkingDetails { 
  PARKING_DETAILS_UNSPECIFIED = 0,
  PARKING_DETAILS_UNKNOWN = 1,
  PARKING_DETAILS_FREE_ONSITE = 2,
  PARKING_DETAILS_FREE_OFFSITE = 3,
  PARKING_DETAILS_PAID_ONSITE = 4,
  PARKING_DETAILS_PAID_OFFSITE = 5,
}
export enum BirthdateVerificationStatus { 
  BIRTHDATE_VERIFICATION_STATUS_UNSPECIFIED = 0,
  BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED = 1,
  BIRTHDATE_VERIFICATION_STATUS_VERIFIED = 2,
  BIRTHDATE_VERIFICATION_STATUS_MISMATCH = 3,
}
export enum GenderVerificationStatus { 
  GENDER_VERIFICATION_STATUS_UNSPECIFIED = 0,
  GENDER_VERIFICATION_STATUS_UNVERIFIED = 1,
  GENDER_VERIFICATION_STATUS_VERIFIED = 2,
  GENDER_VERIFICATION_STATUS_MISMATCH = 3,
}
