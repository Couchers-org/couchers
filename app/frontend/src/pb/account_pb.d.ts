import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";

import * as pb_annotations_pb from "../pb/annotations_pb";

export class GetAccountInfoRes extends jspb.Message {
  getLoginMethod(): GetAccountInfoRes.LoginMethod;
  setLoginMethod(value: GetAccountInfoRes.LoginMethod): GetAccountInfoRes;

  getHasPassword(): boolean;
  setHasPassword(value: boolean): GetAccountInfoRes;

  getEmail(): string;
  setEmail(value: string): GetAccountInfoRes;

  getProfileComplete(): boolean;
  setProfileComplete(value: boolean): GetAccountInfoRes;

  getPhone(): string;
  setPhone(value: string): GetAccountInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAccountInfoRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetAccountInfoRes
  ): GetAccountInfoRes.AsObject;
  static serializeBinaryToWriter(
    message: GetAccountInfoRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetAccountInfoRes;
  static deserializeBinaryFromReader(
    message: GetAccountInfoRes,
    reader: jspb.BinaryReader
  ): GetAccountInfoRes;
}

export namespace GetAccountInfoRes {
  export type AsObject = {
    loginMethod: GetAccountInfoRes.LoginMethod;
    hasPassword: boolean;
    email: string;
    profileComplete: boolean;
    phone: string;
  };

  export enum LoginMethod {
    MAGIC_LINK = 0,
    PASSWORD = 1,
  }
}

export class ChangePasswordReq extends jspb.Message {
  getOldPassword(): google_protobuf_wrappers_pb.StringValue | undefined;
  setOldPassword(
    value?: google_protobuf_wrappers_pb.StringValue
  ): ChangePasswordReq;
  hasOldPassword(): boolean;
  clearOldPassword(): ChangePasswordReq;

  getNewPassword(): google_protobuf_wrappers_pb.StringValue | undefined;
  setNewPassword(
    value?: google_protobuf_wrappers_pb.StringValue
  ): ChangePasswordReq;
  hasNewPassword(): boolean;
  clearNewPassword(): ChangePasswordReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangePasswordReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ChangePasswordReq
  ): ChangePasswordReq.AsObject;
  static serializeBinaryToWriter(
    message: ChangePasswordReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChangePasswordReq;
  static deserializeBinaryFromReader(
    message: ChangePasswordReq,
    reader: jspb.BinaryReader
  ): ChangePasswordReq;
}

export namespace ChangePasswordReq {
  export type AsObject = {
    oldPassword?: google_protobuf_wrappers_pb.StringValue.AsObject;
    newPassword?: google_protobuf_wrappers_pb.StringValue.AsObject;
  };
}

export class ChangeEmailReq extends jspb.Message {
  getPassword(): google_protobuf_wrappers_pb.StringValue | undefined;
  setPassword(value?: google_protobuf_wrappers_pb.StringValue): ChangeEmailReq;
  hasPassword(): boolean;
  clearPassword(): ChangeEmailReq;

  getNewEmail(): string;
  setNewEmail(value: string): ChangeEmailReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangeEmailReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ChangeEmailReq
  ): ChangeEmailReq.AsObject;
  static serializeBinaryToWriter(
    message: ChangeEmailReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChangeEmailReq;
  static deserializeBinaryFromReader(
    message: ChangeEmailReq,
    reader: jspb.BinaryReader
  ): ChangeEmailReq;
}

export namespace ChangeEmailReq {
  export type AsObject = {
    password?: google_protobuf_wrappers_pb.StringValue.AsObject;
    newEmail: string;
  };
}

export class GetContributorFormInfoRes extends jspb.Message {
  getFilledContributorForm(): boolean;
  setFilledContributorForm(value: boolean): GetContributorFormInfoRes;

  getUsername(): string;
  setUsername(value: string): GetContributorFormInfoRes;

  getName(): string;
  setName(value: string): GetContributorFormInfoRes;

  getEmail(): string;
  setEmail(value: string): GetContributorFormInfoRes;

  getAge(): number;
  setAge(value: number): GetContributorFormInfoRes;

  getGender(): string;
  setGender(value: string): GetContributorFormInfoRes;

  getLocation(): string;
  setLocation(value: string): GetContributorFormInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetContributorFormInfoRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetContributorFormInfoRes
  ): GetContributorFormInfoRes.AsObject;
  static serializeBinaryToWriter(
    message: GetContributorFormInfoRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetContributorFormInfoRes;
  static deserializeBinaryFromReader(
    message: GetContributorFormInfoRes,
    reader: jspb.BinaryReader
  ): GetContributorFormInfoRes;
}

export namespace GetContributorFormInfoRes {
  export type AsObject = {
    filledContributorForm: boolean;
    username: string;
    name: string;
    email: string;
    age: number;
    gender: string;
    location: string;
  };
}

export class MarkContributorFormFilledReq extends jspb.Message {
  getFilledContributorForm(): boolean;
  setFilledContributorForm(value: boolean): MarkContributorFormFilledReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkContributorFormFilledReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MarkContributorFormFilledReq
  ): MarkContributorFormFilledReq.AsObject;
  static serializeBinaryToWriter(
    message: MarkContributorFormFilledReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MarkContributorFormFilledReq;
  static deserializeBinaryFromReader(
    message: MarkContributorFormFilledReq,
    reader: jspb.BinaryReader
  ): MarkContributorFormFilledReq;
}

export namespace MarkContributorFormFilledReq {
  export type AsObject = {
    filledContributorForm: boolean;
  };
}

export class ChangePhoneReq extends jspb.Message {
  getPhone(): string;
  setPhone(value: string): ChangePhoneReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChangePhoneReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ChangePhoneReq
  ): ChangePhoneReq.AsObject;
  static serializeBinaryToWriter(
    message: ChangePhoneReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ChangePhoneReq;
  static deserializeBinaryFromReader(
    message: ChangePhoneReq,
    reader: jspb.BinaryReader
  ): ChangePhoneReq;
}

export namespace ChangePhoneReq {
  export type AsObject = {
    phone: string;
  };
}

export class VerifyPhoneReq extends jspb.Message {
  getToken(): string;
  setToken(value: string): VerifyPhoneReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VerifyPhoneReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: VerifyPhoneReq
  ): VerifyPhoneReq.AsObject;
  static serializeBinaryToWriter(
    message: VerifyPhoneReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): VerifyPhoneReq;
  static deserializeBinaryFromReader(
    message: VerifyPhoneReq,
    reader: jspb.BinaryReader
  ): VerifyPhoneReq;
}

export namespace VerifyPhoneReq {
  export type AsObject = {
    token: string;
  };
}
