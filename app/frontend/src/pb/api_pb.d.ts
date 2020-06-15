import * as jspb from "google-protobuf"

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';

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
  getUserId(): number;
  setUserId(value: number): PingRes;

  getUsername(): string;
  setUsername(value: string): PingRes;

  getName(): string;
  setName(value: string): PingRes;

  getUnreadMessageCount(): number;
  setUnreadMessageCount(value: number): PingRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingRes.AsObject;
  static toObject(includeInstance: boolean, msg: PingRes): PingRes.AsObject;
  static serializeBinaryToWriter(message: PingRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PingRes;
  static deserializeBinaryFromReader(message: PingRes, reader: jspb.BinaryReader): PingRes;
}

export namespace PingRes {
  export type AsObject = {
    userId: number,
    username: string,
    name: string,
    unreadMessageCount: number,
  }
}

export class User extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): User;

  getName(): string;
  setName(value: string): User;

  getCity(): string;
  setCity(value: string): User;

  getVerification(): number;
  setVerification(value: number): User;

  getCommunityStanding(): number;
  setCommunityStanding(value: number): User;

  getNumReferences(): number;
  setNumReferences(value: number): User;

  getGender(): string;
  setGender(value: string): User;

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

  getOccupation(): string;
  setOccupation(value: string): User;

  getAboutMe(): string;
  setAboutMe(value: string): User;

  getAboutPlace(): string;
  setAboutPlace(value: string): User;

  getLanguagesList(): Array<string>;
  setLanguagesList(value: Array<string>): User;
  clearLanguagesList(): User;
  addLanguages(value: string, index?: number): User;

  getCountriesVisitedList(): Array<string>;
  setCountriesVisitedList(value: Array<string>): User;
  clearCountriesVisitedList(): User;
  addCountriesVisited(value: string, index?: number): User;

  getCountriesLivedList(): Array<string>;
  setCountriesLivedList(value: Array<string>): User;
  clearCountriesLivedList(): User;
  addCountriesLived(value: string, index?: number): User;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): User.AsObject;
  static toObject(includeInstance: boolean, msg: User): User.AsObject;
  static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): User;
  static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
  export type AsObject = {
    username: string,
    name: string,
    city: string,
    verification: number,
    communityStanding: number,
    numReferences: number,
    gender: string,
    age: number,
    joined?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastActive?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    occupation: string,
    aboutMe: string,
    aboutPlace: string,
    languagesList: Array<string>,
    countriesVisitedList: Array<string>,
    countriesLivedList: Array<string>,
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

