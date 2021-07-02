import * as jspb from 'google-protobuf'
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';

import * as pb_threads_pb from '../pb/threads_pb';


export class Discussion extends jspb.Message {
  getDiscussionId(): number;
  setDiscussionId(value: number): Discussion;

  getSlug(): string;
  setSlug(value: string): Discussion;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Discussion;
  hasCreated(): boolean;
  clearCreated(): Discussion;

  getCreatorUserId(): number;
  setCreatorUserId(value: number): Discussion;

  getOwnerCommunityId(): number;
  setOwnerCommunityId(value: number): Discussion;

  getOwnerGroupId(): number;
  setOwnerGroupId(value: number): Discussion;

  getTitle(): string;
  setTitle(value: string): Discussion;

  getContent(): string;
  setContent(value: string): Discussion;

  getThread(): pb_threads_pb.Thread | undefined;
  setThread(value?: pb_threads_pb.Thread): Discussion;
  hasThread(): boolean;
  clearThread(): Discussion;

  getCanModerate(): boolean;
  setCanModerate(value: boolean): Discussion;

  getOwnerCase(): Discussion.OwnerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Discussion.AsObject;
  static toObject(includeInstance: boolean, msg: Discussion): Discussion.AsObject;
  static serializeBinaryToWriter(message: Discussion, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Discussion;
  static deserializeBinaryFromReader(message: Discussion, reader: jspb.BinaryReader): Discussion;
}

export namespace Discussion {
  export type AsObject = {
    discussionId: number,
    slug: string,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    creatorUserId: number,
    ownerCommunityId: number,
    ownerGroupId: number,
    title: string,
    content: string,
    thread?: pb_threads_pb.Thread.AsObject,
    canModerate: boolean,
  }

  export enum OwnerCase { 
    OWNER_NOT_SET = 0,
    OWNER_COMMUNITY_ID = 5,
    OWNER_GROUP_ID = 6,
  }
}

export class CreateDiscussionReq extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): CreateDiscussionReq;

  getContent(): string;
  setContent(value: string): CreateDiscussionReq;

  getOwnerCommunityId(): number;
  setOwnerCommunityId(value: number): CreateDiscussionReq;

  getOwnerGroupId(): number;
  setOwnerGroupId(value: number): CreateDiscussionReq;

  getOwnerCase(): CreateDiscussionReq.OwnerCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateDiscussionReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateDiscussionReq): CreateDiscussionReq.AsObject;
  static serializeBinaryToWriter(message: CreateDiscussionReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateDiscussionReq;
  static deserializeBinaryFromReader(message: CreateDiscussionReq, reader: jspb.BinaryReader): CreateDiscussionReq;
}

export namespace CreateDiscussionReq {
  export type AsObject = {
    title: string,
    content: string,
    ownerCommunityId: number,
    ownerGroupId: number,
  }

  export enum OwnerCase { 
    OWNER_NOT_SET = 0,
    OWNER_COMMUNITY_ID = 3,
    OWNER_GROUP_ID = 4,
  }
}

export class GetDiscussionReq extends jspb.Message {
  getDiscussionId(): number;
  setDiscussionId(value: number): GetDiscussionReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDiscussionReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetDiscussionReq): GetDiscussionReq.AsObject;
  static serializeBinaryToWriter(message: GetDiscussionReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDiscussionReq;
  static deserializeBinaryFromReader(message: GetDiscussionReq, reader: jspb.BinaryReader): GetDiscussionReq;
}

export namespace GetDiscussionReq {
  export type AsObject = {
    discussionId: number,
  }
}

