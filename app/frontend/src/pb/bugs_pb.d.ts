import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';


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

  getUserId(): number;
  setUserId(value: number): ReportBugReq;

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
    userId: number,
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

