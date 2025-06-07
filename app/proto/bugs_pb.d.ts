import * as jspb from 'google-protobuf'

import * as google_api_annotations_pb from './google/api/annotations_pb'; // proto import: "google/api/annotations.proto"
import * as google_api_httpbody_pb from './google/api/httpbody_pb'; // proto import: "google/api/httpbody.proto"
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"


export class VersionInfo extends jspb.Message {
  getVersion(): string;
  setVersion(value: string): VersionInfo;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VersionInfo.AsObject;
  static toObject(includeInstance: boolean, msg: VersionInfo): VersionInfo.AsObject;
  static serializeBinaryToWriter(message: VersionInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VersionInfo;
  static deserializeBinaryFromReader(message: VersionInfo, reader: jspb.BinaryReader): VersionInfo;
}

export namespace VersionInfo {
  export type AsObject = {
    version: string,
  }
}

export class ReportBugReq extends jspb.Message {
  getSubject(): string;
  setSubject(value: string): ReportBugReq;

  getDescription(): string;
  setDescription(value: string): ReportBugReq;

  getResults(): string;
  setResults(value: string): ReportBugReq;

  getFrontendVersion(): string;
  setFrontendVersion(value: string): ReportBugReq;

  getUserAgent(): string;
  setUserAgent(value: string): ReportBugReq;

  getPage(): string;
  setPage(value: string): ReportBugReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReportBugReq.AsObject;
  static toObject(includeInstance: boolean, msg: ReportBugReq): ReportBugReq.AsObject;
  static serializeBinaryToWriter(message: ReportBugReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReportBugReq;
  static deserializeBinaryFromReader(message: ReportBugReq, reader: jspb.BinaryReader): ReportBugReq;
}

export namespace ReportBugReq {
  export type AsObject = {
    subject: string,
    description: string,
    results: string,
    frontendVersion: string,
    userAgent: string,
    page: string,
  }
}

export class ReportBugRes extends jspb.Message {
  getBugId(): string;
  setBugId(value: string): ReportBugRes;

  getBugUrl(): string;
  setBugUrl(value: string): ReportBugRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReportBugRes.AsObject;
  static toObject(includeInstance: boolean, msg: ReportBugRes): ReportBugRes.AsObject;
  static serializeBinaryToWriter(message: ReportBugRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReportBugRes;
  static deserializeBinaryFromReader(message: ReportBugRes, reader: jspb.BinaryReader): ReportBugRes;
}

export namespace ReportBugRes {
  export type AsObject = {
    bugId: string,
    bugUrl: string,
  }
}

export class StatusReq extends jspb.Message {
  getNonce(): string;
  setNonce(value: string): StatusReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatusReq.AsObject;
  static toObject(includeInstance: boolean, msg: StatusReq): StatusReq.AsObject;
  static serializeBinaryToWriter(message: StatusReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatusReq;
  static deserializeBinaryFromReader(message: StatusReq, reader: jspb.BinaryReader): StatusReq;
}

export namespace StatusReq {
  export type AsObject = {
    nonce: string,
  }
}

export class StatusRes extends jspb.Message {
  getNonce(): string;
  setNonce(value: string): StatusRes;

  getVersion(): string;
  setVersion(value: string): StatusRes;

  getCoucherCount(): number;
  setCoucherCount(value: number): StatusRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatusRes.AsObject;
  static toObject(includeInstance: boolean, msg: StatusRes): StatusRes.AsObject;
  static serializeBinaryToWriter(message: StatusRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatusRes;
  static deserializeBinaryFromReader(message: StatusRes, reader: jspb.BinaryReader): StatusRes;
}

export namespace StatusRes {
  export type AsObject = {
    nonce: string,
    version: string,
    coucherCount: number,
  }
}

