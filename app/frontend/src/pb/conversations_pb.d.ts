import * as jspb from 'google-protobuf'
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';


export class MessageContentText extends jspb.Message {
  getText(): string;
  setText(value: string): MessageContentText;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentText.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentText): MessageContentText.AsObject;
  static serializeBinaryToWriter(message: MessageContentText, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentText;
  static deserializeBinaryFromReader(message: MessageContentText, reader: jspb.BinaryReader): MessageContentText;
}

export namespace MessageContentText {
  export type AsObject = {
    text: string,
  }
}

export class MessageContentChatCreated extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentChatCreated.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentChatCreated): MessageContentChatCreated.AsObject;
  static serializeBinaryToWriter(message: MessageContentChatCreated, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentChatCreated;
  static deserializeBinaryFromReader(message: MessageContentChatCreated, reader: jspb.BinaryReader): MessageContentChatCreated;
}

export namespace MessageContentChatCreated {
  export type AsObject = {
  }
}

export class MessageContentChatEdited extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentChatEdited.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentChatEdited): MessageContentChatEdited.AsObject;
  static serializeBinaryToWriter(message: MessageContentChatEdited, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentChatEdited;
  static deserializeBinaryFromReader(message: MessageContentChatEdited, reader: jspb.BinaryReader): MessageContentChatEdited;
}

export namespace MessageContentChatEdited {
  export type AsObject = {
  }
}

export class MessageContentUserInvited extends jspb.Message {
  getTargetUserId(): number;
  setTargetUserId(value: number): MessageContentUserInvited;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentUserInvited.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentUserInvited): MessageContentUserInvited.AsObject;
  static serializeBinaryToWriter(message: MessageContentUserInvited, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentUserInvited;
  static deserializeBinaryFromReader(message: MessageContentUserInvited, reader: jspb.BinaryReader): MessageContentUserInvited;
}

export namespace MessageContentUserInvited {
  export type AsObject = {
    targetUserId: number,
  }
}

export class MessageContentUserLeft extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentUserLeft.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentUserLeft): MessageContentUserLeft.AsObject;
  static serializeBinaryToWriter(message: MessageContentUserLeft, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentUserLeft;
  static deserializeBinaryFromReader(message: MessageContentUserLeft, reader: jspb.BinaryReader): MessageContentUserLeft;
}

export namespace MessageContentUserLeft {
  export type AsObject = {
  }
}

export class MessageContentUserMadeAdmin extends jspb.Message {
  getTargetUserId(): number;
  setTargetUserId(value: number): MessageContentUserMadeAdmin;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentUserMadeAdmin.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentUserMadeAdmin): MessageContentUserMadeAdmin.AsObject;
  static serializeBinaryToWriter(message: MessageContentUserMadeAdmin, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentUserMadeAdmin;
  static deserializeBinaryFromReader(message: MessageContentUserMadeAdmin, reader: jspb.BinaryReader): MessageContentUserMadeAdmin;
}

export namespace MessageContentUserMadeAdmin {
  export type AsObject = {
    targetUserId: number,
  }
}

export class MessageContentUserRemovedAdmin extends jspb.Message {
  getTargetUserId(): number;
  setTargetUserId(value: number): MessageContentUserRemovedAdmin;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentUserRemovedAdmin.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentUserRemovedAdmin): MessageContentUserRemovedAdmin.AsObject;
  static serializeBinaryToWriter(message: MessageContentUserRemovedAdmin, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentUserRemovedAdmin;
  static deserializeBinaryFromReader(message: MessageContentUserRemovedAdmin, reader: jspb.BinaryReader): MessageContentUserRemovedAdmin;
}

export namespace MessageContentUserRemovedAdmin {
  export type AsObject = {
    targetUserId: number,
  }
}

export class MessageContentUserRemoved extends jspb.Message {
  getTargetUserId(): number;
  setTargetUserId(value: number): MessageContentUserRemoved;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentUserRemoved.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentUserRemoved): MessageContentUserRemoved.AsObject;
  static serializeBinaryToWriter(message: MessageContentUserRemoved, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentUserRemoved;
  static deserializeBinaryFromReader(message: MessageContentUserRemoved, reader: jspb.BinaryReader): MessageContentUserRemoved;
}

export namespace MessageContentUserRemoved {
  export type AsObject = {
    targetUserId: number,
  }
}

export class MessageContentHostRequestStatusChanged extends jspb.Message {
  getStatus(): HostRequestStatus;
  setStatus(value: HostRequestStatus): MessageContentHostRequestStatusChanged;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageContentHostRequestStatusChanged.AsObject;
  static toObject(includeInstance: boolean, msg: MessageContentHostRequestStatusChanged): MessageContentHostRequestStatusChanged.AsObject;
  static serializeBinaryToWriter(message: MessageContentHostRequestStatusChanged, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageContentHostRequestStatusChanged;
  static deserializeBinaryFromReader(message: MessageContentHostRequestStatusChanged, reader: jspb.BinaryReader): MessageContentHostRequestStatusChanged;
}

export namespace MessageContentHostRequestStatusChanged {
  export type AsObject = {
    status: HostRequestStatus,
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

  getText(): MessageContentText | undefined;
  setText(value?: MessageContentText): Message;
  hasText(): boolean;
  clearText(): Message;

  getChatCreated(): MessageContentChatCreated | undefined;
  setChatCreated(value?: MessageContentChatCreated): Message;
  hasChatCreated(): boolean;
  clearChatCreated(): Message;

  getChatEdited(): MessageContentChatEdited | undefined;
  setChatEdited(value?: MessageContentChatEdited): Message;
  hasChatEdited(): boolean;
  clearChatEdited(): Message;

  getUserInvited(): MessageContentUserInvited | undefined;
  setUserInvited(value?: MessageContentUserInvited): Message;
  hasUserInvited(): boolean;
  clearUserInvited(): Message;

  getUserLeft(): MessageContentUserLeft | undefined;
  setUserLeft(value?: MessageContentUserLeft): Message;
  hasUserLeft(): boolean;
  clearUserLeft(): Message;

  getUserMadeAdmin(): MessageContentUserMadeAdmin | undefined;
  setUserMadeAdmin(value?: MessageContentUserMadeAdmin): Message;
  hasUserMadeAdmin(): boolean;
  clearUserMadeAdmin(): Message;

  getUserRemovedAdmin(): MessageContentUserRemovedAdmin | undefined;
  setUserRemovedAdmin(value?: MessageContentUserRemovedAdmin): Message;
  hasUserRemovedAdmin(): boolean;
  clearUserRemovedAdmin(): Message;

  getHostRequestStatusChanged(): MessageContentHostRequestStatusChanged | undefined;
  setHostRequestStatusChanged(value?: MessageContentHostRequestStatusChanged): Message;
  hasHostRequestStatusChanged(): boolean;
  clearHostRequestStatusChanged(): Message;

  getGroupChatUserRemoved(): MessageContentUserRemoved | undefined;
  setGroupChatUserRemoved(value?: MessageContentUserRemoved): Message;
  hasGroupChatUserRemoved(): boolean;
  clearGroupChatUserRemoved(): Message;

  getContentCase(): Message.ContentCase;

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
    text?: MessageContentText.AsObject,
    chatCreated?: MessageContentChatCreated.AsObject,
    chatEdited?: MessageContentChatEdited.AsObject,
    userInvited?: MessageContentUserInvited.AsObject,
    userLeft?: MessageContentUserLeft.AsObject,
    userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
    userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
    hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
    groupChatUserRemoved?: MessageContentUserRemoved.AsObject,
  }

  export enum ContentCase { 
    CONTENT_NOT_SET = 0,
    TEXT = 4,
    CHAT_CREATED = 5,
    CHAT_EDITED = 6,
    USER_INVITED = 7,
    USER_LEFT = 8,
    USER_MADE_ADMIN = 9,
    USER_REMOVED_ADMIN = 10,
    HOST_REQUEST_STATUS_CHANGED = 11,
    GROUP_CHAT_USER_REMOVED = 12,
  }
}

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

  getUnseenMessageCount(): number;
  setUnseenMessageCount(value: number): GroupChat;

  getLastSeenMessageId(): number;
  setLastSeenMessageId(value: number): GroupChat;

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
    unseenMessageCount: number,
    lastSeenMessageId: number,
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

  getLastMessageId(): number;
  setLastMessageId(value: number): ListGroupChatsRes;

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
    lastMessageId: number,
    noMore: boolean,
  }
}

export class GetUpdatesReq extends jspb.Message {
  getNewestMessageId(): number;
  setNewestMessageId(value: number): GetUpdatesReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUpdatesReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetUpdatesReq): GetUpdatesReq.AsObject;
  static serializeBinaryToWriter(message: GetUpdatesReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUpdatesReq;
  static deserializeBinaryFromReader(message: GetUpdatesReq, reader: jspb.BinaryReader): GetUpdatesReq;
}

export namespace GetUpdatesReq {
  export type AsObject = {
    newestMessageId: number,
  }
}

export class GetDirectMessageReq extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): GetDirectMessageReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDirectMessageReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetDirectMessageReq): GetDirectMessageReq.AsObject;
  static serializeBinaryToWriter(message: GetDirectMessageReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDirectMessageReq;
  static deserializeBinaryFromReader(message: GetDirectMessageReq, reader: jspb.BinaryReader): GetDirectMessageReq;
}

export namespace GetDirectMessageReq {
  export type AsObject = {
    userId: number,
  }
}

export class Update extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): Update;

  getMessage(): Message | undefined;
  setMessage(value?: Message): Update;
  hasMessage(): boolean;
  clearMessage(): Update;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Update.AsObject;
  static toObject(includeInstance: boolean, msg: Update): Update.AsObject;
  static serializeBinaryToWriter(message: Update, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Update;
  static deserializeBinaryFromReader(message: Update, reader: jspb.BinaryReader): Update;
}

export namespace Update {
  export type AsObject = {
    groupChatId: number,
    message?: Message.AsObject,
  }
}

export class GetUpdatesRes extends jspb.Message {
  getUpdatesList(): Array<Update>;
  setUpdatesList(value: Array<Update>): GetUpdatesRes;
  clearUpdatesList(): GetUpdatesRes;
  addUpdates(value?: Update, index?: number): Update;

  getNoMore(): boolean;
  setNoMore(value: boolean): GetUpdatesRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUpdatesRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetUpdatesRes): GetUpdatesRes.AsObject;
  static serializeBinaryToWriter(message: GetUpdatesRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUpdatesRes;
  static deserializeBinaryFromReader(message: GetUpdatesRes, reader: jspb.BinaryReader): GetUpdatesRes;
}

export namespace GetUpdatesRes {
  export type AsObject = {
    updatesList: Array<Update.AsObject>,
    noMore: boolean,
  }
}

export class GetGroupChatMessagesReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): GetGroupChatMessagesReq;

  getLastMessageId(): number;
  setLastMessageId(value: number): GetGroupChatMessagesReq;

  getNumber(): number;
  setNumber(value: number): GetGroupChatMessagesReq;

  getOnlyUnseen(): boolean;
  setOnlyUnseen(value: boolean): GetGroupChatMessagesReq;

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
    onlyUnseen: boolean,
  }
}

export class GetGroupChatMessagesRes extends jspb.Message {
  getMessagesList(): Array<Message>;
  setMessagesList(value: Array<Message>): GetGroupChatMessagesRes;
  clearMessagesList(): GetGroupChatMessagesRes;
  addMessages(value?: Message, index?: number): Message;

  getLastMessageId(): number;
  setLastMessageId(value: number): GetGroupChatMessagesRes;

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
    lastMessageId: number,
    noMore: boolean,
  }
}

export class MarkLastSeenGroupChatReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): MarkLastSeenGroupChatReq;

  getLastSeenMessageId(): number;
  setLastSeenMessageId(value: number): MarkLastSeenGroupChatReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkLastSeenGroupChatReq.AsObject;
  static toObject(includeInstance: boolean, msg: MarkLastSeenGroupChatReq): MarkLastSeenGroupChatReq.AsObject;
  static serializeBinaryToWriter(message: MarkLastSeenGroupChatReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkLastSeenGroupChatReq;
  static deserializeBinaryFromReader(message: MarkLastSeenGroupChatReq, reader: jspb.BinaryReader): MarkLastSeenGroupChatReq;
}

export namespace MarkLastSeenGroupChatReq {
  export type AsObject = {
    groupChatId: number,
    lastSeenMessageId: number,
  }
}

export class CreateGroupChatReq extends jspb.Message {
  getTitle(): google_protobuf_wrappers_pb.StringValue | undefined;
  setTitle(value?: google_protobuf_wrappers_pb.StringValue): CreateGroupChatReq;
  hasTitle(): boolean;
  clearTitle(): CreateGroupChatReq;

  getRecipientUserIdsList(): Array<number>;
  setRecipientUserIdsList(value: Array<number>): CreateGroupChatReq;
  clearRecipientUserIdsList(): CreateGroupChatReq;
  addRecipientUserIds(value: number, index?: number): CreateGroupChatReq;

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
    recipientUserIdsList: Array<number>,
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

export class InviteToGroupChatReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): InviteToGroupChatReq;

  getUserId(): number;
  setUserId(value: number): InviteToGroupChatReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InviteToGroupChatReq.AsObject;
  static toObject(includeInstance: boolean, msg: InviteToGroupChatReq): InviteToGroupChatReq.AsObject;
  static serializeBinaryToWriter(message: InviteToGroupChatReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InviteToGroupChatReq;
  static deserializeBinaryFromReader(message: InviteToGroupChatReq, reader: jspb.BinaryReader): InviteToGroupChatReq;
}

export namespace InviteToGroupChatReq {
  export type AsObject = {
    groupChatId: number,
    userId: number,
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

export class RemoveGroupChatUserReq extends jspb.Message {
  getGroupChatId(): number;
  setGroupChatId(value: number): RemoveGroupChatUserReq;

  getUserId(): number;
  setUserId(value: number): RemoveGroupChatUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveGroupChatUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveGroupChatUserReq): RemoveGroupChatUserReq.AsObject;
  static serializeBinaryToWriter(message: RemoveGroupChatUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveGroupChatUserReq;
  static deserializeBinaryFromReader(message: RemoveGroupChatUserReq, reader: jspb.BinaryReader): RemoveGroupChatUserReq;
}

export namespace RemoveGroupChatUserReq {
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

  getLastMessageId(): number;
  setLastMessageId(value: number): SearchMessagesReq;

  getNumber(): number;
  setNumber(value: number): SearchMessagesReq;

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
    lastMessageId: number,
    number: number,
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

  getLastMessageId(): number;
  setLastMessageId(value: number): SearchMessagesRes;

  getNoMore(): boolean;
  setNoMore(value: boolean): SearchMessagesRes;

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
    lastMessageId: number,
    noMore: boolean,
  }
}

export enum HostRequestStatus { 
  HOST_REQUEST_STATUS_PENDING = 0,
  HOST_REQUEST_STATUS_ACCEPTED = 1,
  HOST_REQUEST_STATUS_REJECTED = 2,
  HOST_REQUEST_STATUS_CONFIRMED = 3,
  HOST_REQUEST_STATUS_CANCELLED = 4,
}
