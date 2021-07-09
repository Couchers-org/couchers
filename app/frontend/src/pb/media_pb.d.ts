import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class UploadRequest extends jspb.Message {
  getKey(): string;
  setKey(value: string): UploadRequest;

  getType(): UploadRequest.UploadType;
  setType(value: UploadRequest.UploadType): UploadRequest;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): UploadRequest;
  hasCreated(): boolean;
  clearCreated(): UploadRequest;

  getExpiry(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setExpiry(value?: google_protobuf_timestamp_pb.Timestamp): UploadRequest;
  hasExpiry(): boolean;
  clearExpiry(): UploadRequest;

  getMaxWidth(): number;
  setMaxWidth(value: number): UploadRequest;

  getMaxHeight(): number;
  setMaxHeight(value: number): UploadRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UploadRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UploadRequest
  ): UploadRequest.AsObject;
  static serializeBinaryToWriter(
    message: UploadRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): UploadRequest;
  static deserializeBinaryFromReader(
    message: UploadRequest,
    reader: jspb.BinaryReader
  ): UploadRequest;
}

export namespace UploadRequest {
  export type AsObject = {
    key: string;
    type: UploadRequest.UploadType;
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    expiry?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    maxWidth: number;
    maxHeight: number;
  };

  export enum UploadType {
    IMAGE = 0,
  }
}

export class UploadConfirmationReq extends jspb.Message {
  getKey(): string;
  setKey(value: string): UploadConfirmationReq;

  getFilename(): string;
  setFilename(value: string): UploadConfirmationReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UploadConfirmationReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: UploadConfirmationReq
  ): UploadConfirmationReq.AsObject;
  static serializeBinaryToWriter(
    message: UploadConfirmationReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): UploadConfirmationReq;
  static deserializeBinaryFromReader(
    message: UploadConfirmationReq,
    reader: jspb.BinaryReader
  ): UploadConfirmationReq;
}

export namespace UploadConfirmationReq {
  export type AsObject = {
    key: string;
    filename: string;
  };
}
