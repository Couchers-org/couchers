import * as jspb from "google-protobuf"

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

export class GroupChat extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): GroupChat;

  getTitle(): string;
  setTitle(value: string): GroupChat;

  getMemberUserIdsList(): Array<number>;
  setMemberUserIdsList(value: Array<number>): GroupChat;
  clearMemberUserIdsList(): GroupChat;
  addMemberUserIds(value: number, index?: number): GroupChat;

  getAdminUserIdsList(): Array<number>;
  setAdminUserIdsList(value: Array<number>): GroupChat;
  clearAdminUserIdsList(): GroupChat;
  addAdminUserIds(value: number, index?: number): GroupChat;

  getOnlyAdminsInvite(): boolean;
  setOnlyAdminsInvite(value: boolean): GroupChat;

  getIsDm(): boolean;
  setIsDm(value: boolean): GroupChat;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): GroupChat;
  hasCreated(): boolean;
  clearCreated(): GroupChat;

  getLatestMessage(): Message | undefined;
  setLatestMessage(value?: Message): GroupChat;
  hasLatestMessage(): boolean;
  clearLatestMessage(): GroupChat;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GroupChat.AsObject;
  static toObject(includeInstance: boolean, msg: GroupChat): GroupChat.AsObject;
  static serializeBinaryToWriter(message: GroupChat, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GroupChat;
  static deserializeBinaryFromReader(message: GroupChat, reader: jspb.BinaryReader): GroupChat;
}

export namespace GroupChat {
  export type AsObject = {
    groupChatId: number,
    title: string,
    memberUserIdsList: Array<number>,
    adminUserIdsList: Array<number>,
    onlyAdminsInvite: boolean,
    isDm: boolean,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    latestMessage?: Message.AsObject,
  }
}

export class GetGroupChatReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): GetGroupChatReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetGroupChatReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetGroupChatReq): GetGroupChatReq.AsObject;
  static serializeBinaryToWriter(message: GetGroupChatReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetGroupChatReq;
  static deserializeBinaryFromReader(message: GetGroupChatReq, reader: jspb.BinaryReader): GetGroupChatReq;
}

export namespace GetGroupChatReq {
  export type AsObject = {
    groupChatId: number,
  }
}

export class ListGroupChatsReq extends jspb.Message {
  getLastMessageId(): number;
  setLastMessageId(value: number): ListGroupChatsReq;

  getNumber(): number;
  setNumber(value: number): ListGroupChatsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListGroupChatsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListGroupChatsReq): ListGroupChatsReq.AsObject;
  static serializeBinaryToWriter(message: ListGroupChatsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListGroupChatsReq;
  static deserializeBinaryFromReader(message: ListGroupChatsReq, reader: jspb.BinaryReader): ListGroupChatsReq;
}

export namespace ListGroupChatsReq {
  export type AsObject = {
    lastMessageId: number,
    number: number,
  }
}

export class ListGroupChatsRes extends jspb.Message {
  getGroupChatsList(): Array<GroupChat>;
  setGroupChatsList(value: Array<GroupChat>): ListGroupChatsRes;
  clearGroupChatsList(): ListGroupChatsRes;
  addGroupChats(value?: GroupChat, index?: number): GroupChat;

  getNextMessageId(): number;
  setNextMessageId(value: number): ListGroupChatsRes;

  getNoMore(): boolean;
  setNoMore(value: boolean): ListGroupChatsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListGroupChatsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListGroupChatsRes): ListGroupChatsRes.AsObject;
  static serializeBinaryToWriter(message: ListGroupChatsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListGroupChatsRes;
  static deserializeBinaryFromReader(message: ListGroupChatsRes, reader: jspb.BinaryReader): ListGroupChatsRes;
}

export namespace ListGroupChatsRes {
  export type AsObject = {
    groupChatsList: Array<GroupChat.AsObject>,
    nextMessageId: number,
    noMore: boolean,
  }
}

export class Message extends jspb.Message {
  getMessageId(): number;
  setMessageId(value: number): Message;

  getAuthorUserId(): number;
  setAuthorUserId(value: number): Message;

  getTime(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTime(value?: google_protobuf_timestamp_pb.Timestamp): Message;
  hasTime(): boolean;
  clearTime(): Message;

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
    messageId: number,
    authorUserId: number,
    time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    text: string,
  }
}

export class GetGroupChatMessagesReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): GetGroupChatMessagesReq;

  getLastMessageId(): number;
  setLastMessageId(value: number): GetGroupChatMessagesReq;

  getNumber(): number;
  setNumber(value: number): GetGroupChatMessagesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetGroupChatMessagesReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetGroupChatMessagesReq): GetGroupChatMessagesReq.AsObject;
  static serializeBinaryToWriter(message: GetGroupChatMessagesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetGroupChatMessagesReq;
  static deserializeBinaryFromReader(message: GetGroupChatMessagesReq, reader: jspb.BinaryReader): GetGroupChatMessagesReq;
}

export namespace GetGroupChatMessagesReq {
  export type AsObject = {
    groupChatId: number,
    lastMessageId: number,
    number: number,
  }
}

export class GetGroupChatMessagesRes extends jspb.Message {
  getMessagesList(): Array<Message>;
  setMessagesList(value: Array<Message>): GetGroupChatMessagesRes;
  clearMessagesList(): GetGroupChatMessagesRes;
  addMessages(value?: Message, index?: number): Message;

  getNextMessageId(): number;
  setNextMessageId(value: number): GetGroupChatMessagesRes;

  getNoMore(): boolean;
  setNoMore(value: boolean): GetGroupChatMessagesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetGroupChatMessagesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetGroupChatMessagesRes): GetGroupChatMessagesRes.AsObject;
  static serializeBinaryToWriter(message: GetGroupChatMessagesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetGroupChatMessagesRes;
  static deserializeBinaryFromReader(message: GetGroupChatMessagesRes, reader: jspb.BinaryReader): GetGroupChatMessagesRes;
}

export namespace GetGroupChatMessagesRes {
  export type AsObject = {
    messagesList: Array<Message.AsObject>,
    nextMessageId: number,
    noMore: boolean,
  }
}

export class CreateGroupChatReq extends jspb.Message {
  getTitle(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTitle(value?: google_protobuf_wrappers_pb.StringValue): CreateGroupChatReq;
  hasTitle(): boolean;
  clearTitle(): CreateGroupChatReq;

  getRecipientIdsList(): Array<number>;
  setRecipientIdsList(value: Array<number>): CreateGroupChatReq;
  clearRecipientIdsList(): CreateGroupChatReq;
  addRecipientIds(value: number, index?: number): CreateGroupChatReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateGroupChatReq.AsObject;
  static toObject(includeInstance: boolean, msg: CreateGroupChatReq): CreateGroupChatReq.AsObject;
  static serializeBinaryToWriter(message: CreateGroupChatReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateGroupChatReq;
  static deserializeBinaryFromReader(message: CreateGroupChatReq, reader: jspb.BinaryReader): CreateGroupChatReq;
}

export namespace CreateGroupChatReq {
  export type AsObject = {
    title?: google_protobuf_wrappers_pb.StringValue.AsObject,
    recipientIdsList: Array<number>,
  }
}

export class EditGroupChatReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): EditGroupChatReq;

  getTitle(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTitle(value?: google_protobuf_wrappers_pb.StringValue): EditGroupChatReq;
  hasTitle(): boolean;
  clearTitle(): EditGroupChatReq;

  getOnlyAdminsInvite(): google_protobuf_wrappers_pb.BoolValue | undefined;
  setOnlyAdminsInvite(value?: google_protobuf_wrappers_pb.BoolValue): EditGroupChatReq;
  hasOnlyAdminsInvite(): boolean;
  clearOnlyAdminsInvite(): EditGroupChatReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EditGroupChatReq.AsObject;
  static toObject(includeInstance: boolean, msg: EditGroupChatReq): EditGroupChatReq.AsObject;
  static serializeBinaryToWriter(message: EditGroupChatReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EditGroupChatReq;
  static deserializeBinaryFromReader(message: EditGroupChatReq, reader: jspb.BinaryReader): EditGroupChatReq;
}

export namespace EditGroupChatReq {
  export type AsObject = {
    groupChatId: number,
    title?: google_protobuf_wrappers_pb.StringValue.AsObject,
    onlyAdminsInvite?: google_protobuf_wrappers_pb.BoolValue.AsObject,
  }
}

export class MakeGroupChatAdminReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): MakeGroupChatAdminReq;

  getUserId(): number;
  setUserId(value: number): MakeGroupChatAdminReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MakeGroupChatAdminReq.AsObject;
  static toObject(includeInstance: boolean, msg: MakeGroupChatAdminReq): MakeGroupChatAdminReq.AsObject;
  static serializeBinaryToWriter(message: MakeGroupChatAdminReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MakeGroupChatAdminReq;
  static deserializeBinaryFromReader(message: MakeGroupChatAdminReq, reader: jspb.BinaryReader): MakeGroupChatAdminReq;
}

export namespace MakeGroupChatAdminReq {
  export type AsObject = {
    groupChatId: number,
    userId: number,
  }
}

export class RemoveGroupChatAdminReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): RemoveGroupChatAdminReq;

  getUserId(): number;
  setUserId(value: number): RemoveGroupChatAdminReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveGroupChatAdminReq.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveGroupChatAdminReq): RemoveGroupChatAdminReq.AsObject;
  static serializeBinaryToWriter(message: RemoveGroupChatAdminReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveGroupChatAdminReq;
  static deserializeBinaryFromReader(message: RemoveGroupChatAdminReq, reader: jspb.BinaryReader): RemoveGroupChatAdminReq;
}

export namespace RemoveGroupChatAdminReq {
  export type AsObject = {
    groupChatId: number,
    userId: number,
  }
}

export class SendMessageReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): SendMessageReq;

  getText(): string;
  setText(value: string): SendMessageReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendMessageReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendMessageReq): SendMessageReq.AsObject;
  static serializeBinaryToWriter(message: SendMessageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendMessageReq;
  static deserializeBinaryFromReader(message: SendMessageReq, reader: jspb.BinaryReader): SendMessageReq;
}

export namespace SendMessageReq {
  export type AsObject = {
    groupChatId: number,
    text: string,
  }
}

export class LeaveGroupChatReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): LeaveGroupChatReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LeaveGroupChatReq.AsObject;
  static toObject(includeInstance: boolean, msg: LeaveGroupChatReq): LeaveGroupChatReq.AsObject;
  static serializeBinaryToWriter(message: LeaveGroupChatReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LeaveGroupChatReq;
  static deserializeBinaryFromReader(message: LeaveGroupChatReq, reader: jspb.BinaryReader): LeaveGroupChatReq;
}

export namespace LeaveGroupChatReq {
  export type AsObject = {
    groupChatId: number,
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
  getGroupChatId(): number;
  setGroupChatId(value: number): MessageSearchResult;

  getMessage(): Message | undefined;
  setMessage(value?: Message): MessageSearchResult;
  hasMessage(): boolean;
  clearMessage(): MessageSearchResult;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageSearchResult.AsObject;
  static toObject(includeInstance: boolean, msg: MessageSearchResult): MessageSearchResult.AsObject;
  static serializeBinaryToWriter(message: MessageSearchResult, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageSearchResult;
  static deserializeBinaryFromReader(message: MessageSearchResult, reader: jspb.BinaryReader): MessageSearchResult;
}

export namespace MessageSearchResult {
  export type AsObject = {
    groupChatId: number,
    message?: Message.AsObject,
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

