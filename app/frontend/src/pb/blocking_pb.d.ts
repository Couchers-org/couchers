import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";

export class BlockUserReq extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): BlockUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BlockUserReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: BlockUserReq
  ): BlockUserReq.AsObject;
  static serializeBinaryToWriter(
    message: BlockUserReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): BlockUserReq;
  static deserializeBinaryFromReader(
    message: BlockUserReq,
    reader: jspb.BinaryReader
  ): BlockUserReq;
}

export namespace BlockUserReq {
  export type AsObject = {
    username: string;
  };
}

export class UnblockUserReq extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): UnblockUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnblockUserReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UnblockUserReq
  ): UnblockUserReq.AsObject;
  static serializeBinaryToWriter(
    message: UnblockUserReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): UnblockUserReq;
  static deserializeBinaryFromReader(
    message: UnblockUserReq,
    reader: jspb.BinaryReader
  ): UnblockUserReq;
}

export namespace UnblockUserReq {
  export type AsObject = {
    username: string;
  };
}

export class GetBlockedUsersRes extends jspb.Message {
  getBlockedUsernamesList(): Array<string>;
  setBlockedUsernamesList(value: Array<string>): GetBlockedUsersRes;
  clearBlockedUsernamesList(): GetBlockedUsersRes;
  addBlockedUsernames(value: string, index?: number): GetBlockedUsersRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetBlockedUsersRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetBlockedUsersRes
  ): GetBlockedUsersRes.AsObject;
  static serializeBinaryToWriter(
    message: GetBlockedUsersRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetBlockedUsersRes;
  static deserializeBinaryFromReader(
    message: GetBlockedUsersRes,
    reader: jspb.BinaryReader
  ): GetBlockedUsersRes;
}

export namespace GetBlockedUsersRes {
  export type AsObject = {
    blockedUsernamesList: Array<string>;
  };
}
