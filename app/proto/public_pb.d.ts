import * as jspb from 'google-protobuf'

import * as google_api_annotations_pb from './google/api/annotations_pb'; // proto import: "google/api/annotations.proto"
import * as google_api_httpbody_pb from './google/api/httpbody_pb'; // proto import: "google/api/httpbody.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"
import * as api_pb from './api_pb'; // proto import: "api.proto"


export class GetPublicUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetPublicUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPublicUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetPublicUserReq): GetPublicUserReq.AsObject;
  static serializeBinaryToWriter(message: GetPublicUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetPublicUserReq;
  static deserializeBinaryFromReader(message: GetPublicUserReq, reader: jspb.BinaryReader): GetPublicUserReq;
}

export namespace GetPublicUserReq {
  export type AsObject = {
    user: string,
  }
}

export class LimitedUser extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): LimitedUser;

  getName(): string;
  setName(value: string): LimitedUser;

  getCity(): string;
  setCity(value: string): LimitedUser;

  getHometown(): string;
  setHometown(value: string): LimitedUser;

  getNumReferences(): number;
  setNumReferences(value: number): LimitedUser;

  getJoined(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setJoined(value?: google_protobuf_timestamp_pb.Timestamp): LimitedUser;
  hasJoined(): boolean;
  clearJoined(): LimitedUser;

  getHostingStatus(): api_pb.HostingStatus;
  setHostingStatus(value: api_pb.HostingStatus): LimitedUser;

  getMeetupStatus(): api_pb.MeetupStatus;
  setMeetupStatus(value: api_pb.MeetupStatus): LimitedUser;

  getBadgesList(): Array<string>;
  setBadgesList(value: Array<string>): LimitedUser;
  clearBadgesList(): LimitedUser;
  addBadges(value: string, index?: number): LimitedUser;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LimitedUser.AsObject;
  static toObject(includeInstance: boolean, msg: LimitedUser): LimitedUser.AsObject;
  static serializeBinaryToWriter(message: LimitedUser, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LimitedUser;
  static deserializeBinaryFromReader(message: LimitedUser, reader: jspb.BinaryReader): LimitedUser;
}

export namespace LimitedUser {
  export type AsObject = {
    username: string,
    name: string,
    city: string,
    hometown: string,
    numReferences: number,
    joined?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    hostingStatus: api_pb.HostingStatus,
    meetupStatus: api_pb.MeetupStatus,
    badgesList: Array<string>,
  }
}

export class MostUser extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): MostUser;

  getName(): string;
  setName(value: string): MostUser;

  getCity(): string;
  setCity(value: string): MostUser;

  getHometown(): string;
  setHometown(value: string): MostUser;

  getTimezone(): string;
  setTimezone(value: string): MostUser;

  getNumReferences(): number;
  setNumReferences(value: number): MostUser;

  getGender(): string;
  setGender(value: string): MostUser;

  getPronouns(): string;
  setPronouns(value: string): MostUser;

  getAge(): number;
  setAge(value: number): MostUser;

  getJoined(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setJoined(value?: google_protobuf_timestamp_pb.Timestamp): MostUser;
  hasJoined(): boolean;
  clearJoined(): MostUser;

  getLastActive(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastActive(value?: google_protobuf_timestamp_pb.Timestamp): MostUser;
  hasLastActive(): boolean;
  clearLastActive(): MostUser;

  getHostingStatus(): api_pb.HostingStatus;
  setHostingStatus(value: api_pb.HostingStatus): MostUser;

  getMeetupStatus(): api_pb.MeetupStatus;
  setMeetupStatus(value: api_pb.MeetupStatus): MostUser;

  getOccupation(): string;
  setOccupation(value: string): MostUser;

  getEducation(): string;
  setEducation(value: string): MostUser;

  getAboutMe(): string;
  setAboutMe(value: string): MostUser;

  getThingsILike(): string;
  setThingsILike(value: string): MostUser;

  getRegionsVisitedList(): Array<string>;
  setRegionsVisitedList(value: Array<string>): MostUser;
  clearRegionsVisitedList(): MostUser;
  addRegionsVisited(value: string, index?: number): MostUser;

  getRegionsLivedList(): Array<string>;
  setRegionsLivedList(value: Array<string>): MostUser;
  clearRegionsLivedList(): MostUser;
  addRegionsLived(value: string, index?: number): MostUser;

  getAvatarUrl(): string;
  setAvatarUrl(value: string): MostUser;

  getAvatarThumbnailUrl(): string;
  setAvatarThumbnailUrl(value: string): MostUser;

  getLanguageAbilitiesList(): Array<api_pb.LanguageAbility>;
  setLanguageAbilitiesList(value: Array<api_pb.LanguageAbility>): MostUser;
  clearLanguageAbilitiesList(): MostUser;
  addLanguageAbilities(value?: api_pb.LanguageAbility, index?: number): api_pb.LanguageAbility;

  getBadgesList(): Array<string>;
  setBadgesList(value: Array<string>): MostUser;
  clearBadgesList(): MostUser;
  addBadges(value: string, index?: number): MostUser;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MostUser.AsObject;
  static toObject(includeInstance: boolean, msg: MostUser): MostUser.AsObject;
  static serializeBinaryToWriter(message: MostUser, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MostUser;
  static deserializeBinaryFromReader(message: MostUser, reader: jspb.BinaryReader): MostUser;
}

export namespace MostUser {
  export type AsObject = {
    username: string,
    name: string,
    city: string,
    hometown: string,
    timezone: string,
    numReferences: number,
    gender: string,
    pronouns: string,
    age: number,
    joined?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastActive?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    hostingStatus: api_pb.HostingStatus,
    meetupStatus: api_pb.MeetupStatus,
    occupation: string,
    education: string,
    aboutMe: string,
    thingsILike: string,
    regionsVisitedList: Array<string>,
    regionsLivedList: Array<string>,
    avatarUrl: string,
    avatarThumbnailUrl: string,
    languageAbilitiesList: Array<api_pb.LanguageAbility.AsObject>,
    badgesList: Array<string>,
  }
}

export class GetPublicUserRes extends jspb.Message {
  getLimitedUser(): LimitedUser | undefined;
  setLimitedUser(value?: LimitedUser): GetPublicUserRes;
  hasLimitedUser(): boolean;
  clearLimitedUser(): GetPublicUserRes;

  getMostUser(): MostUser | undefined;
  setMostUser(value?: MostUser): GetPublicUserRes;
  hasMostUser(): boolean;
  clearMostUser(): GetPublicUserRes;

  getFullUser(): api_pb.User | undefined;
  setFullUser(value?: api_pb.User): GetPublicUserRes;
  hasFullUser(): boolean;
  clearFullUser(): GetPublicUserRes;

  getProfileCase(): GetPublicUserRes.ProfileCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetPublicUserRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetPublicUserRes): GetPublicUserRes.AsObject;
  static serializeBinaryToWriter(message: GetPublicUserRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetPublicUserRes;
  static deserializeBinaryFromReader(message: GetPublicUserRes, reader: jspb.BinaryReader): GetPublicUserRes;
}

export namespace GetPublicUserRes {
  export type AsObject = {
    limitedUser?: LimitedUser.AsObject,
    mostUser?: MostUser.AsObject,
    fullUser?: api_pb.User.AsObject,
  }

  export enum ProfileCase { 
    PROFILE_NOT_SET = 0,
    LIMITED_USER = 1,
    MOST_USER = 2,
    FULL_USER = 3,
  }
}

export class GetSignupPageInfoRes extends jspb.Message {
  getLastSignup(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastSignup(value?: google_protobuf_timestamp_pb.Timestamp): GetSignupPageInfoRes;
  hasLastSignup(): boolean;
  clearLastSignup(): GetSignupPageInfoRes;

  getLastLocation(): string;
  setLastLocation(value: string): GetSignupPageInfoRes;

  getUserCount(): number;
  setUserCount(value: number): GetSignupPageInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetSignupPageInfoRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetSignupPageInfoRes): GetSignupPageInfoRes.AsObject;
  static serializeBinaryToWriter(message: GetSignupPageInfoRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetSignupPageInfoRes;
  static deserializeBinaryFromReader(message: GetSignupPageInfoRes, reader: jspb.BinaryReader): GetSignupPageInfoRes;
}

export namespace GetSignupPageInfoRes {
  export type AsObject = {
    lastSignup?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastLocation: string,
    userCount: number,
  }
}

