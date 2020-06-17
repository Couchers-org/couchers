import * as jspb from "google-protobuf"

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';

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

export class UpdateProfileReq extends jspb.Message {
  getName(): google_protobuf_wrappers_pb.StringValue | undefined;
  setName(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasName(): boolean;
  clearName(): UpdateProfileReq;

  getCity(): google_protobuf_wrappers_pb.StringValue | undefined;
  setCity(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasCity(): boolean;
  clearCity(): UpdateProfileReq;

  getGender(): google_protobuf_wrappers_pb.StringValue | undefined;
  setGender(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasGender(): boolean;
  clearGender(): UpdateProfileReq;

  getOccupation(): google_protobuf_wrappers_pb.StringValue | undefined;
  setOccupation(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasOccupation(): boolean;
  clearOccupation(): UpdateProfileReq;

  getAboutMe(): google_protobuf_wrappers_pb.StringValue | undefined;
  setAboutMe(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasAboutMe(): boolean;
  clearAboutMe(): UpdateProfileReq;

  getAboutPlace(): google_protobuf_wrappers_pb.StringValue | undefined;
  setAboutPlace(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasAboutPlace(): boolean;
  clearAboutPlace(): UpdateProfileReq;

  getLanguages(): RepeatedStringValue | undefined;
  setLanguages(value?: RepeatedStringValue): UpdateProfileReq;
  hasLanguages(): boolean;
  clearLanguages(): UpdateProfileReq;

  getCountriesVisited(): RepeatedStringValue | undefined;
  setCountriesVisited(value?: RepeatedStringValue): UpdateProfileReq;
  hasCountriesVisited(): boolean;
  clearCountriesVisited(): UpdateProfileReq;

  getCountriesLived(): RepeatedStringValue | undefined;
  setCountriesLived(value?: RepeatedStringValue): UpdateProfileReq;
  hasCountriesLived(): boolean;
  clearCountriesLived(): UpdateProfileReq;

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
    gender?: google_protobuf_wrappers_pb.StringValue.AsObject,
    occupation?: google_protobuf_wrappers_pb.StringValue.AsObject,
    aboutMe?: google_protobuf_wrappers_pb.StringValue.AsObject,
    aboutPlace?: google_protobuf_wrappers_pb.StringValue.AsObject,
    languages?: RepeatedStringValue.AsObject,
    countriesVisited?: RepeatedStringValue.AsObject,
    countriesLived?: RepeatedStringValue.AsObject,
  }

  export class RepeatedStringValue extends jspb.Message {
    getExists(): boolean;
    setExists(value: boolean): RepeatedStringValue;

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
      exists: boolean,
      valueList: Array<string>,
    }
  }

}

export class UpdateProfileRes extends jspb.Message {
  getUpdatedName(): boolean;
  setUpdatedName(value: boolean): UpdateProfileRes;

  getUpdatedCity(): boolean;
  setUpdatedCity(value: boolean): UpdateProfileRes;

  getUpdatedGender(): boolean;
  setUpdatedGender(value: boolean): UpdateProfileRes;

  getUpdatedOccupation(): boolean;
  setUpdatedOccupation(value: boolean): UpdateProfileRes;

  getUpdatedAboutMe(): boolean;
  setUpdatedAboutMe(value: boolean): UpdateProfileRes;

  getUpdatedAboutPlace(): boolean;
  setUpdatedAboutPlace(value: boolean): UpdateProfileRes;

  getUpdatedLanguages(): boolean;
  setUpdatedLanguages(value: boolean): UpdateProfileRes;

  getUpdatedCountriesVisited(): boolean;
  setUpdatedCountriesVisited(value: boolean): UpdateProfileRes;

  getUpdatedCountriesLived(): boolean;
  setUpdatedCountriesLived(value: boolean): UpdateProfileRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateProfileRes.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateProfileRes): UpdateProfileRes.AsObject;
  static serializeBinaryToWriter(message: UpdateProfileRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateProfileRes;
  static deserializeBinaryFromReader(message: UpdateProfileRes, reader: jspb.BinaryReader): UpdateProfileRes;
}

export namespace UpdateProfileRes {
  export type AsObject = {
    updatedName: boolean,
    updatedCity: boolean,
    updatedGender: boolean,
    updatedOccupation: boolean,
    updatedAboutMe: boolean,
    updatedAboutPlace: boolean,
    updatedLanguages: boolean,
    updatedCountriesVisited: boolean,
    updatedCountriesLived: boolean,
  }
}

export class SSOReq extends jspb.Message {
  getSso(): string;
  setSso(value: string): SSOReq;

  getSig(): string;
  setSig(value: string): SSOReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SSOReq.AsObject;
  static toObject(includeInstance: boolean, msg: SSOReq): SSOReq.AsObject;
  static serializeBinaryToWriter(message: SSOReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SSOReq;
  static deserializeBinaryFromReader(message: SSOReq, reader: jspb.BinaryReader): SSOReq;
}

export namespace SSOReq {
  export type AsObject = {
    sso: string,
    sig: string,
  }
}

export class SSORes extends jspb.Message {
  getRedirectUrl(): string;
  setRedirectUrl(value: string): SSORes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SSORes.AsObject;
  static toObject(includeInstance: boolean, msg: SSORes): SSORes.AsObject;
  static serializeBinaryToWriter(message: SSORes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SSORes;
  static deserializeBinaryFromReader(message: SSORes, reader: jspb.BinaryReader): SSORes;
}

export namespace SSORes {
  export type AsObject = {
    redirectUrl: string,
  }
}

