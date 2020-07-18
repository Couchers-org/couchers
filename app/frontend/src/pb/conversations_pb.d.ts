import * as jspb from "google-protobuf"

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

export class MessageThreadPreview extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): MessageThreadPreview;

  getTitle(): string;
  setTitle(value: string): MessageThreadPreview;

  getRecipientsList(): Array<string>;
  setRecipientsList(value: Array<string>): MessageThreadPreview;
  clearRecipientsList(): MessageThreadPreview;
  addRecipients(value: string, index?: number): MessageThreadPreview;

  getIsDm(): boolean;
  setIsDm(value: boolean): MessageThreadPreview;

  getCreationTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreationTime(value?: google_protobuf_timestamp_pb.Timestamp): MessageThreadPreview;
  hasCreationTime(): boolean;
  clearCreationTime(): MessageThreadPreview;

  getStatus(): MessageThreadStatus;
  setStatus(value: MessageThreadStatus): MessageThreadPreview;

  getLatestMessagePreview(): string;
  setLatestMessagePreview(value: string): MessageThreadPreview;

  getLatestMessageSender(): string;
  setLatestMessageSender(value: string): MessageThreadPreview;

  getLatestMessageTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLatestMessageTime(value?: google_protobuf_timestamp_pb.Timestamp): MessageThreadPreview;
  hasLatestMessageTime(): boolean;
  clearLatestMessageTime(): MessageThreadPreview;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageThreadPreview.AsObject;
  static toObject(includeInstance: boolean, msg: MessageThreadPreview): MessageThreadPreview.AsObject;
  static serializeBinaryToWriter(message: MessageThreadPreview, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageThreadPreview;
  static deserializeBinaryFromReader(message: MessageThreadPreview, reader: jspb.BinaryReader): MessageThreadPreview;
}

export namespace MessageThreadPreview {
  export type AsObject = {
    threadId: number,
    title: string,
    recipientsList: Array<string>,
    isDm: boolean,
    creationTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    status: MessageThreadStatus,
    latestMessagePreview: string,
    latestMessageSender: string,
    latestMessageTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ListMessageThreadsReq extends jspb.Message {
  getStartIndex(): number;
  setStartIndex(value: number): ListMessageThreadsReq;

  getMax(): number;
  setMax(value: number): ListMessageThreadsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMessageThreadsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListMessageThreadsReq): ListMessageThreadsReq.AsObject;
  static serializeBinaryToWriter(message: ListMessageThreadsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMessageThreadsReq;
  static deserializeBinaryFromReader(message: ListMessageThreadsReq, reader: jspb.BinaryReader): ListMessageThreadsReq;
}

export namespace ListMessageThreadsReq {
  export type AsObject = {
    startIndex: number,
    max: number,
  }
}

export class ListMessageThreadsRes extends jspb.Message {
  getStartIndex(): number;
  setStartIndex(value: number): ListMessageThreadsRes;

  getThreadsList(): Array<MessageThreadPreview>;
  setThreadsList(value: Array<MessageThreadPreview>): ListMessageThreadsRes;
  clearThreadsList(): ListMessageThreadsRes;
  addThreads(value?: MessageThreadPreview, index?: number): MessageThreadPreview;

  getHasMore(): boolean;
  setHasMore(value: boolean): ListMessageThreadsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMessageThreadsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListMessageThreadsRes): ListMessageThreadsRes.AsObject;
  static serializeBinaryToWriter(message: ListMessageThreadsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMessageThreadsRes;
  static deserializeBinaryFromReader(message: ListMessageThreadsRes, reader: jspb.BinaryReader): ListMessageThreadsRes;
}

export namespace ListMessageThreadsRes {
  export type AsObject = {
    startIndex: number,
    threadsList: Array<MessageThreadPreview.AsObject>,
    hasMore: boolean,
  }
}

export class EditMessageThreadStatusReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): EditMessageThreadStatusReq;

  getStatus(): MessageThreadStatus;
  setStatus(value: MessageThreadStatus): EditMessageThreadStatusReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EditMessageThreadStatusReq.AsObject;
  static toObject(includeInstance: boolean, msg: EditMessageThreadStatusReq): EditMessageThreadStatusReq.AsObject;
  static serializeBinaryToWriter(message: EditMessageThreadStatusReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EditMessageThreadStatusReq;
  static deserializeBinaryFromReader(message: EditMessageThreadStatusReq, reader: jspb.BinaryReader): EditMessageThreadStatusReq;
}

export namespace EditMessageThreadStatusReq {
  export type AsObject = {
    threadId: number,
    status: MessageThreadStatus,
  }
}

export class Message extends jspb.Message {
  getId(): number;
  setId(value: number): Message;

  getSender(): string;
  setSender(value: string): Message;

  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): Message;
  hasTimestamp(): boolean;
  clearTimestamp(): Message;

  getText(): string;
  setText(value: string): Message;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Message.AsObject;
  static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
  static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Message;
  static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
  export type AsObject = {
    id: number,
    sender: string,
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    text: string,
  }
}

export class GetMessageThreadReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): GetMessageThreadReq;

  getStartIndex(): number;
  setStartIndex(value: number): GetMessageThreadReq;

  getMax(): number;
  setMax(value: number): GetMessageThreadReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetMessageThreadReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetMessageThreadReq): GetMessageThreadReq.AsObject;
  static serializeBinaryToWriter(message: GetMessageThreadReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetMessageThreadReq;
  static deserializeBinaryFromReader(message: GetMessageThreadReq, reader: jspb.BinaryReader): GetMessageThreadReq;
}

export namespace GetMessageThreadReq {
  export type AsObject = {
    threadId: number,
    startIndex: number,
    max: number,
  }
}

export class GetMessageThreadRes extends jspb.Message {
  getStartIndex(): number;
  setStartIndex(value: number): GetMessageThreadRes;

  getMessagesList(): Array<Message>;
  setMessagesList(value: Array<Message>): GetMessageThreadRes;
  clearMessagesList(): GetMessageThreadRes;
  addMessages(value?: Message, index?: number): Message;

  getHasMore(): boolean;
  setHasMore(value: boolean): GetMessageThreadRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetMessageThreadRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetMessageThreadRes): GetMessageThreadRes.AsObject;
  static serializeBinaryToWriter(message: GetMessageThreadRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetMessageThreadRes;
  static deserializeBinaryFromReader(message: GetMessageThreadRes, reader: jspb.BinaryReader): GetMessageThreadRes;
}

export namespace GetMessageThreadRes {
  export type AsObject = {
    startIndex: number,
    messagesList: Array<Message.AsObject>,
    hasMore: boolean,
  }
}

export class GetMessageThreadInfoReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): GetMessageThreadInfoReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetMessageThreadInfoReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetMessageThreadInfoReq): GetMessageThreadInfoReq.AsObject;
  static serializeBinaryToWriter(message: GetMessageThreadInfoReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetMessageThreadInfoReq;
  static deserializeBinaryFromReader(message: GetMessageThreadInfoReq, reader: jspb.BinaryReader): GetMessageThreadInfoReq;
}

export namespace GetMessageThreadInfoReq {
  export type AsObject = {
    threadId: number,
  }
}

export class GetMessageThreadInfoRes extends jspb.Message {
  getTitle(): string;
  setTitle(value: string): GetMessageThreadInfoRes;

  getRecipientsList(): Array<string>;
  setRecipientsList(value: Array<string>): GetMessageThreadInfoRes;
  clearRecipientsList(): GetMessageThreadInfoRes;
  addRecipients(value: string, index?: number): GetMessageThreadInfoRes;

  getAdminsList(): Array<string>;
  setAdminsList(value: Array<string>): GetMessageThreadInfoRes;
  clearAdminsList(): GetMessageThreadInfoRes;
  addAdmins(value: string, index?: number): GetMessageThreadInfoRes;

  getCreationTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreationTime(value?: google_protobuf_timestamp_pb.Timestamp): GetMessageThreadInfoRes;
  hasCreationTime(): boolean;
  clearCreationTime(): GetMessageThreadInfoRes;

  getOnlyAdminsInvite(): boolean;
  setOnlyAdminsInvite(value: boolean): GetMessageThreadInfoRes;

  getStatus(): MessageThreadStatus;
  setStatus(value: MessageThreadStatus): GetMessageThreadInfoRes;

  getIsDm(): boolean;
  setIsDm(value: boolean): GetMessageThreadInfoRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetMessageThreadInfoRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetMessageThreadInfoRes): GetMessageThreadInfoRes.AsObject;
  static serializeBinaryToWriter(message: GetMessageThreadInfoRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetMessageThreadInfoRes;
  static deserializeBinaryFromReader(message: GetMessageThreadInfoRes, reader: jspb.BinaryReader): GetMessageThreadInfoRes;
}

export namespace GetMessageThreadInfoRes {
  export type AsObject = {
    title: string,
    recipientsList: Array<string>,
    adminsList: Array<string>,
    creationTime?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    onlyAdminsInvite: boolean,
    status: MessageThreadStatus,
    isDm: boolean,
  }
}

export class CreateMessageThreadReq extends jspb.Message {
  getTitle(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTitle(value?: google_protobuf_wrappers_pb.StringValue): CreateMessageThreadReq;
  hasTitle(): boolean;
  clearTitle(): CreateMessageThreadReq;

  getRecipientsList(): Array<string>;
  setRecipientsList(value: Array<string>): CreateMessageThreadReq;
  clearRecipientsList(): CreateMessageThreadReq;
  addRecipients(value: string, index?: number): CreateMessageThreadReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateMessageThreadReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateMessageThreadReq): CreateMessageThreadReq.AsObject;
  static serializeBinaryToWriter(message: CreateMessageThreadReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateMessageThreadReq;
  static deserializeBinaryFromReader(message: CreateMessageThreadReq, reader: jspb.BinaryReader): CreateMessageThreadReq;
}

export namespace CreateMessageThreadReq {
  export type AsObject = {
    title?: google_protobuf_wrappers_pb.StringValue.AsObject,
    recipientsList: Array<string>,
  }
}

export class CreateMessageThreadRes extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): CreateMessageThreadRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateMessageThreadRes.AsObject;
  static toObject(includeInstance: boolean, msg: CreateMessageThreadRes): CreateMessageThreadRes.AsObject;
  static serializeBinaryToWriter(message: CreateMessageThreadRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateMessageThreadRes;
  static deserializeBinaryFromReader(message: CreateMessageThreadRes, reader: jspb.BinaryReader): CreateMessageThreadRes;
}

export namespace CreateMessageThreadRes {
  export type AsObject = {
    threadId: number,
  }
}

export class EditMessageThreadReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): EditMessageThreadReq;

  getTitle(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTitle(value?: google_protobuf_wrappers_pb.StringValue): EditMessageThreadReq;
  hasTitle(): boolean;
  clearTitle(): EditMessageThreadReq;

  getOnlyAdminsInvite(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setOnlyAdminsInvite(value?: google_protobuf_wrappers_pb.BoolValue): EditMessageThreadReq;
  hasOnlyAdminsInvite(): boolean;
  clearOnlyAdminsInvite(): EditMessageThreadReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EditMessageThreadReq.AsObject;
  static toObject(includeInstance: boolean, msg: EditMessageThreadReq): EditMessageThreadReq.AsObject;
  static serializeBinaryToWriter(message: EditMessageThreadReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EditMessageThreadReq;
  static deserializeBinaryFromReader(message: EditMessageThreadReq, reader: jspb.BinaryReader): EditMessageThreadReq;
}

export namespace EditMessageThreadReq {
  export type AsObject = {
    threadId: number,
    title?: google_protobuf_wrappers_pb.StringValue.AsObject,
    onlyAdminsInvite?: google_protobuf_wrappers_pb.BoolValue.AsObject,
  }
}

export class ThreadUserReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): ThreadUserReq;

  getUser(): string;
  setUser(value: string): ThreadUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ThreadUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: ThreadUserReq): ThreadUserReq.AsObject;
  static serializeBinaryToWriter(message: ThreadUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ThreadUserReq;
  static deserializeBinaryFromReader(message: ThreadUserReq, reader: jspb.BinaryReader): ThreadUserReq;
}

export namespace ThreadUserReq {
  export type AsObject = {
    threadId: number,
    user: string,
  }
}

export class SendMessageReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): SendMessageReq;

  getMessage(): string;
  setMessage(value: string): SendMessageReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendMessageReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendMessageReq): SendMessageReq.AsObject;
  static serializeBinaryToWriter(message: SendMessageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendMessageReq;
  static deserializeBinaryFromReader(message: SendMessageReq, reader: jspb.BinaryReader): SendMessageReq;
}

export namespace SendMessageReq {
  export type AsObject = {
    threadId: number,
    message: string,
  }
}

export class LeaveMessageThreadReq extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): LeaveMessageThreadReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LeaveMessageThreadReq.AsObject;
  static toObject(includeInstance: boolean, msg: LeaveMessageThreadReq): LeaveMessageThreadReq.AsObject;
  static serializeBinaryToWriter(message: LeaveMessageThreadReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LeaveMessageThreadReq;
  static deserializeBinaryFromReader(message: LeaveMessageThreadReq, reader: jspb.BinaryReader): LeaveMessageThreadReq;
}

export namespace LeaveMessageThreadReq {
  export type AsObject = {
    threadId: number,
  }
}

export class SearchMessagesReq extends jspb.Message {
  getQuery(): string;
  setQuery(value: string): SearchMessagesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchMessagesReq.AsObject;
  static toObject(includeInstance: boolean, msg: SearchMessagesReq): SearchMessagesReq.AsObject;
  static serializeBinaryToWriter(message: SearchMessagesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchMessagesReq;
  static deserializeBinaryFromReader(message: SearchMessagesReq, reader: jspb.BinaryReader): SearchMessagesReq;
}

export namespace SearchMessagesReq {
  export type AsObject = {
    query: string,
  }
}

export class MessageSearchResult extends jspb.Message {
  getThreadId(): number;
  setThreadId(value: number): MessageSearchResult;

  getMessageId(): number;
  setMessageId(value: number): MessageSearchResult;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageSearchResult.AsObject;
  static toObject(includeInstance: boolean, msg: MessageSearchResult): MessageSearchResult.AsObject;
  static serializeBinaryToWriter(message: MessageSearchResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageSearchResult;
  static deserializeBinaryFromReader(message: MessageSearchResult, reader: jspb.BinaryReader): MessageSearchResult;
}

export namespace MessageSearchResult {
  export type AsObject = {
    threadId: number,
    messageId: number,
  }
}

export class SearchMessagesRes extends jspb.Message {
  getResultsList(): Array<MessageSearchResult>;
  setResultsList(value: Array<MessageSearchResult>): SearchMessagesRes;
  clearResultsList(): SearchMessagesRes;
  addResults(value?: MessageSearchResult, index?: number): MessageSearchResult;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchMessagesRes.AsObject;
  static toObject(includeInstance: boolean, msg: SearchMessagesRes): SearchMessagesRes.AsObject;
  static serializeBinaryToWriter(message: SearchMessagesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchMessagesRes;
  static deserializeBinaryFromReader(message: SearchMessagesRes, reader: jspb.BinaryReader): SearchMessagesRes;
}

export namespace SearchMessagesRes {
  export type AsObject = {
    resultsList: Array<MessageSearchResult.AsObject>,
  }
}

export enum MessageThreadStatus { 
  PENDING = 0,
  ACCEPTED = 1,
  REJECTED = 2,
}
