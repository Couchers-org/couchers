import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class Thread extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): Thread;

  getNumResponses(): number;
  setNumResponses(value: number): Thread;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Thread.AsObject;
  static toObject(includeInstance: boolean, msg: Thread): Thread.AsObject;
  static serializeBinaryToWriter(
    message: Thread,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Thread;
  static deserializeBinaryFromReader(
    message: Thread,
    reader: jspb.BinaryReader
  ): Thread;
}

export namespace Thread {
  export type AsObject = {
    threadId: number;
    numResponses: number;
  };
}

export class GetThreadReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): GetThreadReq;

  getPageSize(): number;
  setPageSize(value: number): GetThreadReq;

  getPageToken(): string;
  setPageToken(value: string): GetThreadReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetThreadReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetThreadReq
  ): GetThreadReq.AsObject;
  static serializeBinaryToWriter(
    message: GetThreadReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetThreadReq;
  static deserializeBinaryFromReader(
    message: GetThreadReq,
    reader: jspb.BinaryReader
  ): GetThreadReq;
}

export namespace GetThreadReq {
  export type AsObject = {
    threadId: number;
    pageSize: number;
    pageToken: string;
  };
}

export class GetThreadRes extends jspb.Message {
  getRepliesList(): Array<Reply>;
  setRepliesList(value: Array<Reply>): GetThreadRes;
  clearRepliesList(): GetThreadRes;
  addReplies(value?: Reply, index?: number): Reply;

  getNextPageToken(): string;
  setNextPageToken(value: string): GetThreadRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetThreadRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GetThreadRes
  ): GetThreadRes.AsObject;
  static serializeBinaryToWriter(
    message: GetThreadRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GetThreadRes;
  static deserializeBinaryFromReader(
    message: GetThreadRes,
    reader: jspb.BinaryReader
  ): GetThreadRes;
}

export namespace GetThreadRes {
  export type AsObject = {
    repliesList: Array<Reply.AsObject>;
    nextPageToken: string;
  };
}

export class Reply extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): Reply;

  getContent(): string;
  setContent(value: string): Reply;

  getAuthorUserId(): number;
  setAuthorUserId(value: number): Reply;

  getCreatedTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreatedTime(value?: google_protobuf_timestamp_pb.Timestamp): Reply;
  hasCreatedTime(): boolean;
  clearCreatedTime(): Reply;

  getNumReplies(): number;
  setNumReplies(value: number): Reply;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Reply.AsObject;
  static toObject(includeInstance: boolean, msg: Reply): Reply.AsObject;
  static serializeBinaryToWriter(
    message: Reply,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Reply;
  static deserializeBinaryFromReader(
    message: Reply,
    reader: jspb.BinaryReader
  ): Reply;
}

export namespace Reply {
  export type AsObject = {
    threadId: number;
    content: string;
    authorUserId: number;
    createdTime?: google_protobuf_timestamp_pb.Timestamp.AsObject;
    numReplies: number;
  };
}

export class PostReplyReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): PostReplyReq;

  getContent(): string;
  setContent(value: string): PostReplyReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PostReplyReq.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PostReplyReq
  ): PostReplyReq.AsObject;
  static serializeBinaryToWriter(
    message: PostReplyReq,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PostReplyReq;
  static deserializeBinaryFromReader(
    message: PostReplyReq,
    reader: jspb.BinaryReader
  ): PostReplyReq;
}

export namespace PostReplyReq {
  export type AsObject = {
    threadId: number;
    content: string;
  };
}

export class PostReplyRes extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): PostReplyRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PostReplyRes.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: PostReplyRes
  ): PostReplyRes.AsObject;
  static serializeBinaryToWriter(
    message: PostReplyRes,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): PostReplyRes;
  static deserializeBinaryFromReader(
    message: PostReplyRes,
    reader: jspb.BinaryReader
  ): PostReplyRes;
}

export namespace PostReplyRes {
  export type AsObject = {
    threadId: number;
  };
}
