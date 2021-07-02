import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_conversations_pb from '../pb/conversations_pb';


export class CreateHostRequestReq extends jspb.Message {
  getToUserId(): number;
  setToUserId(value: number): CreateHostRequestReq;

  getFromDate(): string;
  setFromDate(value: string): CreateHostRequestReq;

  getToDate(): string;
  setToDate(value: string): CreateHostRequestReq;

  getText(): string;
  setText(value: string): CreateHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateHostRequestReq): CreateHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: CreateHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateHostRequestReq;
  static deserializeBinaryFromReader(message: CreateHostRequestReq, reader: jspb.BinaryReader): CreateHostRequestReq;
}

export namespace CreateHostRequestReq {
  export type AsObject = {
    toUserId: number,
    fromDate: string,
    toDate: string,
    text: string,
  }
}

export class HostRequest extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): HostRequest;

  getFromUserId(): number;
  setFromUserId(value: number): HostRequest;

  getToUserId(): number;
  setToUserId(value: number): HostRequest;

  getStatus(): pb_conversations_pb.HostRequestStatus;
  setStatus(value: pb_conversations_pb.HostRequestStatus): HostRequest;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): HostRequest;
  hasCreated(): boolean;
  clearCreated(): HostRequest;

  getFromDate(): string;
  setFromDate(value: string): HostRequest;

  getToDate(): string;
  setToDate(value: string): HostRequest;

  getLastSeenMessageId(): number;
  setLastSeenMessageId(value: number): HostRequest;

  getLatestMessage(): pb_conversations_pb.Message | undefined;
  setLatestMessage(value?: pb_conversations_pb.Message): HostRequest;
  hasLatestMessage(): boolean;
  clearLatestMessage(): HostRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequest.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequest): HostRequest.AsObject;
  static serializeBinaryToWriter(message: HostRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequest;
  static deserializeBinaryFromReader(message: HostRequest, reader: jspb.BinaryReader): HostRequest;
}

export namespace HostRequest {
  export type AsObject = {
    hostRequestId: number,
    fromUserId: number,
    toUserId: number,
    status: pb_conversations_pb.HostRequestStatus,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    fromDate: string,
    toDate: string,
    lastSeenMessageId: number,
    latestMessage?: pb_conversations_pb.Message.AsObject,
  }
}

export class GetHostRequestReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): GetHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestReq): GetHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestReq;
  static deserializeBinaryFromReader(message: GetHostRequestReq, reader: jspb.BinaryReader): GetHostRequestReq;
}

export namespace GetHostRequestReq {
  export type AsObject = {
    hostRequestId: number,
  }
}

export class CreateHostRequestRes extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): CreateHostRequestRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateHostRequestRes.AsObject;
  static toObject(includeInstance: boolean, msg: CreateHostRequestRes): CreateHostRequestRes.AsObject;
  static serializeBinaryToWriter(message: CreateHostRequestRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateHostRequestRes;
  static deserializeBinaryFromReader(message: CreateHostRequestRes, reader: jspb.BinaryReader): CreateHostRequestRes;
}

export namespace CreateHostRequestRes {
  export type AsObject = {
    hostRequestId: number,
  }
}

export class RespondHostRequestReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): RespondHostRequestReq;

  getStatus(): pb_conversations_pb.HostRequestStatus;
  setStatus(value: pb_conversations_pb.HostRequestStatus): RespondHostRequestReq;

  getText(): string;
  setText(value: string): RespondHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RespondHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: RespondHostRequestReq): RespondHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: RespondHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RespondHostRequestReq;
  static deserializeBinaryFromReader(message: RespondHostRequestReq, reader: jspb.BinaryReader): RespondHostRequestReq;
}

export namespace RespondHostRequestReq {
  export type AsObject = {
    hostRequestId: number,
    status: pb_conversations_pb.HostRequestStatus,
    text: string,
  }
}

export class ListHostRequestsReq extends jspb.Message {
  getLastRequestId(): number;
  setLastRequestId(value: number): ListHostRequestsReq;

  getNumber(): number;
  setNumber(value: number): ListHostRequestsReq;

  getOnlyActive(): boolean;
  setOnlyActive(value: boolean): ListHostRequestsReq;

  getOnlySent(): boolean;
  setOnlySent(value: boolean): ListHostRequestsReq;

  getOnlyReceived(): boolean;
  setOnlyReceived(value: boolean): ListHostRequestsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListHostRequestsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListHostRequestsReq): ListHostRequestsReq.AsObject;
  static serializeBinaryToWriter(message: ListHostRequestsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListHostRequestsReq;
  static deserializeBinaryFromReader(message: ListHostRequestsReq, reader: jspb.BinaryReader): ListHostRequestsReq;
}

export namespace ListHostRequestsReq {
  export type AsObject = {
    lastRequestId: number,
    number: number,
    onlyActive: boolean,
    onlySent: boolean,
    onlyReceived: boolean,
  }
}

export class ListHostRequestsRes extends jspb.Message {
  getHostRequestsList(): Array<HostRequest>;
  setHostRequestsList(value: Array<HostRequest>): ListHostRequestsRes;
  clearHostRequestsList(): ListHostRequestsRes;
  addHostRequests(value?: HostRequest, index?: number): HostRequest;

  getLastRequestId(): number;
  setLastRequestId(value: number): ListHostRequestsRes;

  getNoMore(): boolean;
  setNoMore(value: boolean): ListHostRequestsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListHostRequestsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListHostRequestsRes): ListHostRequestsRes.AsObject;
  static serializeBinaryToWriter(message: ListHostRequestsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListHostRequestsRes;
  static deserializeBinaryFromReader(message: ListHostRequestsRes, reader: jspb.BinaryReader): ListHostRequestsRes;
}

export namespace ListHostRequestsRes {
  export type AsObject = {
    hostRequestsList: Array<HostRequest.AsObject>,
    lastRequestId: number,
    noMore: boolean,
  }
}

export class GetHostRequestMessagesReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): GetHostRequestMessagesReq;

  getLastMessageId(): number;
  setLastMessageId(value: number): GetHostRequestMessagesReq;

  getNumber(): number;
  setNumber(value: number): GetHostRequestMessagesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestMessagesReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestMessagesReq): GetHostRequestMessagesReq.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestMessagesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestMessagesReq;
  static deserializeBinaryFromReader(message: GetHostRequestMessagesReq, reader: jspb.BinaryReader): GetHostRequestMessagesReq;
}

export namespace GetHostRequestMessagesReq {
  export type AsObject = {
    hostRequestId: number,
    lastMessageId: number,
    number: number,
  }
}

export class GetHostRequestMessagesRes extends jspb.Message {
  getMessagesList(): Array<pb_conversations_pb.Message>;
  setMessagesList(value: Array<pb_conversations_pb.Message>): GetHostRequestMessagesRes;
  clearMessagesList(): GetHostRequestMessagesRes;
  addMessages(value?: pb_conversations_pb.Message, index?: number): pb_conversations_pb.Message;

  getLastMessageId(): number;
  setLastMessageId(value: number): GetHostRequestMessagesRes;

  getNoMore(): boolean;
  setNoMore(value: boolean): GetHostRequestMessagesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestMessagesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestMessagesRes): GetHostRequestMessagesRes.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestMessagesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestMessagesRes;
  static deserializeBinaryFromReader(message: GetHostRequestMessagesRes, reader: jspb.BinaryReader): GetHostRequestMessagesRes;
}

export namespace GetHostRequestMessagesRes {
  export type AsObject = {
    messagesList: Array<pb_conversations_pb.Message.AsObject>,
    lastMessageId: number,
    noMore: boolean,
  }
}

export class SendHostRequestMessageReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): SendHostRequestMessageReq;

  getText(): string;
  setText(value: string): SendHostRequestMessageReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendHostRequestMessageReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendHostRequestMessageReq): SendHostRequestMessageReq.AsObject;
  static serializeBinaryToWriter(message: SendHostRequestMessageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendHostRequestMessageReq;
  static deserializeBinaryFromReader(message: SendHostRequestMessageReq, reader: jspb.BinaryReader): SendHostRequestMessageReq;
}

export namespace SendHostRequestMessageReq {
  export type AsObject = {
    hostRequestId: number,
    text: string,
  }
}

export class GetHostRequestUpdatesReq extends jspb.Message {
  getNewestMessageId(): number;
  setNewestMessageId(value: number): GetHostRequestUpdatesReq;

  getNumber(): number;
  setNumber(value: number): GetHostRequestUpdatesReq;

  getOnlySent(): boolean;
  setOnlySent(value: boolean): GetHostRequestUpdatesReq;

  getOnlyReceived(): boolean;
  setOnlyReceived(value: boolean): GetHostRequestUpdatesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestUpdatesReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestUpdatesReq): GetHostRequestUpdatesReq.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestUpdatesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestUpdatesReq;
  static deserializeBinaryFromReader(message: GetHostRequestUpdatesReq, reader: jspb.BinaryReader): GetHostRequestUpdatesReq;
}

export namespace GetHostRequestUpdatesReq {
  export type AsObject = {
    newestMessageId: number,
    number: number,
    onlySent: boolean,
    onlyReceived: boolean,
  }
}

export class HostRequestUpdate extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): HostRequestUpdate;

  getMessage(): pb_conversations_pb.Message | undefined;
  setMessage(value?: pb_conversations_pb.Message): HostRequestUpdate;
  hasMessage(): boolean;
  clearMessage(): HostRequestUpdate;

  getStatus(): pb_conversations_pb.HostRequestStatus;
  setStatus(value: pb_conversations_pb.HostRequestStatus): HostRequestUpdate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestUpdate): HostRequestUpdate.AsObject;
  static serializeBinaryToWriter(message: HostRequestUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestUpdate;
  static deserializeBinaryFromReader(message: HostRequestUpdate, reader: jspb.BinaryReader): HostRequestUpdate;
}

export namespace HostRequestUpdate {
  export type AsObject = {
    hostRequestId: number,
    message?: pb_conversations_pb.Message.AsObject,
    status: pb_conversations_pb.HostRequestStatus,
  }
}

export class GetHostRequestUpdatesRes extends jspb.Message {
  getUpdatesList(): Array<HostRequestUpdate>;
  setUpdatesList(value: Array<HostRequestUpdate>): GetHostRequestUpdatesRes;
  clearUpdatesList(): GetHostRequestUpdatesRes;
  addUpdates(value?: HostRequestUpdate, index?: number): HostRequestUpdate;

  getNoMore(): boolean;
  setNoMore(value: boolean): GetHostRequestUpdatesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetHostRequestUpdatesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetHostRequestUpdatesRes): GetHostRequestUpdatesRes.AsObject;
  static serializeBinaryToWriter(message: GetHostRequestUpdatesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetHostRequestUpdatesRes;
  static deserializeBinaryFromReader(message: GetHostRequestUpdatesRes, reader: jspb.BinaryReader): GetHostRequestUpdatesRes;
}

export namespace GetHostRequestUpdatesRes {
  export type AsObject = {
    updatesList: Array<HostRequestUpdate.AsObject>,
    noMore: boolean,
  }
}

export class MarkLastSeenHostRequestReq extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): MarkLastSeenHostRequestReq;

  getLastSeenMessageId(): number;
  setLastSeenMessageId(value: number): MarkLastSeenHostRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkLastSeenHostRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: MarkLastSeenHostRequestReq): MarkLastSeenHostRequestReq.AsObject;
  static serializeBinaryToWriter(message: MarkLastSeenHostRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkLastSeenHostRequestReq;
  static deserializeBinaryFromReader(message: MarkLastSeenHostRequestReq, reader: jspb.BinaryReader): MarkLastSeenHostRequestReq;
}

export namespace MarkLastSeenHostRequestReq {
  export type AsObject = {
    hostRequestId: number,
    lastSeenMessageId: number,
  }
}

