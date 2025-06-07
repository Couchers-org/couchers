import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"


export class ReportReq extends jspb.Message {
  getReason(): string;
  setReason(value: string): ReportReq;

  getDescription(): string;
  setDescription(value: string): ReportReq;

  getContentRef(): string;
  setContentRef(value: string): ReportReq;

  getAuthorUser(): string;
  setAuthorUser(value: string): ReportReq;

  getUserAgent(): string;
  setUserAgent(value: string): ReportReq;

  getPage(): string;
  setPage(value: string): ReportReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReportReq.AsObject;
  static toObject(includeInstance: boolean, msg: ReportReq): ReportReq.AsObject;
  static serializeBinaryToWriter(message: ReportReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReportReq;
  static deserializeBinaryFromReader(message: ReportReq, reader: jspb.BinaryReader): ReportReq;
}

export namespace ReportReq {
  export type AsObject = {
    reason: string,
    description: string,
    contentRef: string,
    authorUser: string,
    userAgent: string,
    page: string,
  }
}

