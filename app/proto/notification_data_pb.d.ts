import * as jspb from 'google-protobuf'

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as api_pb from './api_pb'; // proto import: "api.proto"
import * as communities_pb from './communities_pb'; // proto import: "communities.proto"
import * as discussions_pb from './discussions_pb'; // proto import: "discussions.proto"
import * as events_pb from './events_pb'; // proto import: "events.proto"
import * as requests_pb from './requests_pb'; // proto import: "requests.proto"
import * as threads_pb from './threads_pb'; // proto import: "threads.proto"


export class HostRequestCreate extends jspb.Message {
  getHostRequest(): requests_pb.HostRequest | undefined;
  setHostRequest(value?: requests_pb.HostRequest): HostRequestCreate;
  hasHostRequest(): boolean;
  clearHostRequest(): HostRequestCreate;

  getSurfer(): api_pb.User | undefined;
  setSurfer(value?: api_pb.User): HostRequestCreate;
  hasSurfer(): boolean;
  clearSurfer(): HostRequestCreate;

  getText(): string;
  setText(value: string): HostRequestCreate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestCreate.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestCreate): HostRequestCreate.AsObject;
  static serializeBinaryToWriter(message: HostRequestCreate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestCreate;
  static deserializeBinaryFromReader(message: HostRequestCreate, reader: jspb.BinaryReader): HostRequestCreate;
}

export namespace HostRequestCreate {
  export type AsObject = {
    hostRequest?: requests_pb.HostRequest.AsObject,
    surfer?: api_pb.User.AsObject,
    text: string,
  }
}

export class HostRequestAccept extends jspb.Message {
  getHostRequest(): requests_pb.HostRequest | undefined;
  setHostRequest(value?: requests_pb.HostRequest): HostRequestAccept;
  hasHostRequest(): boolean;
  clearHostRequest(): HostRequestAccept;

  getHost(): api_pb.User | undefined;
  setHost(value?: api_pb.User): HostRequestAccept;
  hasHost(): boolean;
  clearHost(): HostRequestAccept;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestAccept.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestAccept): HostRequestAccept.AsObject;
  static serializeBinaryToWriter(message: HostRequestAccept, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestAccept;
  static deserializeBinaryFromReader(message: HostRequestAccept, reader: jspb.BinaryReader): HostRequestAccept;
}

export namespace HostRequestAccept {
  export type AsObject = {
    hostRequest?: requests_pb.HostRequest.AsObject,
    host?: api_pb.User.AsObject,
  }
}

export class HostRequestReject extends jspb.Message {
  getHostRequest(): requests_pb.HostRequest | undefined;
  setHostRequest(value?: requests_pb.HostRequest): HostRequestReject;
  hasHostRequest(): boolean;
  clearHostRequest(): HostRequestReject;

  getHost(): api_pb.User | undefined;
  setHost(value?: api_pb.User): HostRequestReject;
  hasHost(): boolean;
  clearHost(): HostRequestReject;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestReject.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestReject): HostRequestReject.AsObject;
  static serializeBinaryToWriter(message: HostRequestReject, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestReject;
  static deserializeBinaryFromReader(message: HostRequestReject, reader: jspb.BinaryReader): HostRequestReject;
}

export namespace HostRequestReject {
  export type AsObject = {
    hostRequest?: requests_pb.HostRequest.AsObject,
    host?: api_pb.User.AsObject,
  }
}

export class HostRequestConfirm extends jspb.Message {
  getHostRequest(): requests_pb.HostRequest | undefined;
  setHostRequest(value?: requests_pb.HostRequest): HostRequestConfirm;
  hasHostRequest(): boolean;
  clearHostRequest(): HostRequestConfirm;

  getSurfer(): api_pb.User | undefined;
  setSurfer(value?: api_pb.User): HostRequestConfirm;
  hasSurfer(): boolean;
  clearSurfer(): HostRequestConfirm;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestConfirm.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestConfirm): HostRequestConfirm.AsObject;
  static serializeBinaryToWriter(message: HostRequestConfirm, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestConfirm;
  static deserializeBinaryFromReader(message: HostRequestConfirm, reader: jspb.BinaryReader): HostRequestConfirm;
}

export namespace HostRequestConfirm {
  export type AsObject = {
    hostRequest?: requests_pb.HostRequest.AsObject,
    surfer?: api_pb.User.AsObject,
  }
}

export class HostRequestCancel extends jspb.Message {
  getHostRequest(): requests_pb.HostRequest | undefined;
  setHostRequest(value?: requests_pb.HostRequest): HostRequestCancel;
  hasHostRequest(): boolean;
  clearHostRequest(): HostRequestCancel;

  getSurfer(): api_pb.User | undefined;
  setSurfer(value?: api_pb.User): HostRequestCancel;
  hasSurfer(): boolean;
  clearSurfer(): HostRequestCancel;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestCancel.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestCancel): HostRequestCancel.AsObject;
  static serializeBinaryToWriter(message: HostRequestCancel, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestCancel;
  static deserializeBinaryFromReader(message: HostRequestCancel, reader: jspb.BinaryReader): HostRequestCancel;
}

export namespace HostRequestCancel {
  export type AsObject = {
    hostRequest?: requests_pb.HostRequest.AsObject,
    surfer?: api_pb.User.AsObject,
  }
}

export class HostRequestMessage extends jspb.Message {
  getHostRequest(): requests_pb.HostRequest | undefined;
  setHostRequest(value?: requests_pb.HostRequest): HostRequestMessage;
  hasHostRequest(): boolean;
  clearHostRequest(): HostRequestMessage;

  getUser(): api_pb.User | undefined;
  setUser(value?: api_pb.User): HostRequestMessage;
  hasUser(): boolean;
  clearUser(): HostRequestMessage;

  getText(): string;
  setText(value: string): HostRequestMessage;

  getAmHost(): boolean;
  setAmHost(value: boolean): HostRequestMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestMessage.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestMessage): HostRequestMessage.AsObject;
  static serializeBinaryToWriter(message: HostRequestMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestMessage;
  static deserializeBinaryFromReader(message: HostRequestMessage, reader: jspb.BinaryReader): HostRequestMessage;
}

export namespace HostRequestMessage {
  export type AsObject = {
    hostRequest?: requests_pb.HostRequest.AsObject,
    user?: api_pb.User.AsObject,
    text: string,
    amHost: boolean,
  }
}

export class HostRequestMissedMessages extends jspb.Message {
  getHostRequest(): requests_pb.HostRequest | undefined;
  setHostRequest(value?: requests_pb.HostRequest): HostRequestMissedMessages;
  hasHostRequest(): boolean;
  clearHostRequest(): HostRequestMissedMessages;

  getUser(): api_pb.User | undefined;
  setUser(value?: api_pb.User): HostRequestMissedMessages;
  hasUser(): boolean;
  clearUser(): HostRequestMissedMessages;

  getAmHost(): boolean;
  setAmHost(value: boolean): HostRequestMissedMessages;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HostRequestMissedMessages.AsObject;
  static toObject(includeInstance: boolean, msg: HostRequestMissedMessages): HostRequestMissedMessages.AsObject;
  static serializeBinaryToWriter(message: HostRequestMissedMessages, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HostRequestMissedMessages;
  static deserializeBinaryFromReader(message: HostRequestMissedMessages, reader: jspb.BinaryReader): HostRequestMissedMessages;
}

export namespace HostRequestMissedMessages {
  export type AsObject = {
    hostRequest?: requests_pb.HostRequest.AsObject,
    user?: api_pb.User.AsObject,
    amHost: boolean,
  }
}

export class BadgeAdd extends jspb.Message {
  getBadgeId(): string;
  setBadgeId(value: string): BadgeAdd;

  getBadgeName(): string;
  setBadgeName(value: string): BadgeAdd;

  getBadgeDescription(): string;
  setBadgeDescription(value: string): BadgeAdd;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BadgeAdd.AsObject;
  static toObject(includeInstance: boolean, msg: BadgeAdd): BadgeAdd.AsObject;
  static serializeBinaryToWriter(message: BadgeAdd, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BadgeAdd;
  static deserializeBinaryFromReader(message: BadgeAdd, reader: jspb.BinaryReader): BadgeAdd;
}

export namespace BadgeAdd {
  export type AsObject = {
    badgeId: string,
    badgeName: string,
    badgeDescription: string,
  }
}

export class BadgeRemove extends jspb.Message {
  getBadgeId(): string;
  setBadgeId(value: string): BadgeRemove;

  getBadgeName(): string;
  setBadgeName(value: string): BadgeRemove;

  getBadgeDescription(): string;
  setBadgeDescription(value: string): BadgeRemove;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BadgeRemove.AsObject;
  static toObject(includeInstance: boolean, msg: BadgeRemove): BadgeRemove.AsObject;
  static serializeBinaryToWriter(message: BadgeRemove, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BadgeRemove;
  static deserializeBinaryFromReader(message: BadgeRemove, reader: jspb.BinaryReader): BadgeRemove;
}

export namespace BadgeRemove {
  export type AsObject = {
    badgeId: string,
    badgeName: string,
    badgeDescription: string,
  }
}

export class PhoneNumberChange extends jspb.Message {
  getPhone(): string;
  setPhone(value: string): PhoneNumberChange;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PhoneNumberChange.AsObject;
  static toObject(includeInstance: boolean, msg: PhoneNumberChange): PhoneNumberChange.AsObject;
  static serializeBinaryToWriter(message: PhoneNumberChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PhoneNumberChange;
  static deserializeBinaryFromReader(message: PhoneNumberChange, reader: jspb.BinaryReader): PhoneNumberChange;
}

export namespace PhoneNumberChange {
  export type AsObject = {
    phone: string,
  }
}

export class PhoneNumberVerify extends jspb.Message {
  getPhone(): string;
  setPhone(value: string): PhoneNumberVerify;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PhoneNumberVerify.AsObject;
  static toObject(includeInstance: boolean, msg: PhoneNumberVerify): PhoneNumberVerify.AsObject;
  static serializeBinaryToWriter(message: PhoneNumberVerify, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PhoneNumberVerify;
  static deserializeBinaryFromReader(message: PhoneNumberVerify, reader: jspb.BinaryReader): PhoneNumberVerify;
}

export namespace PhoneNumberVerify {
  export type AsObject = {
    phone: string,
  }
}

export class GenderChange extends jspb.Message {
  getGender(): string;
  setGender(value: string): GenderChange;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GenderChange.AsObject;
  static toObject(includeInstance: boolean, msg: GenderChange): GenderChange.AsObject;
  static serializeBinaryToWriter(message: GenderChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GenderChange;
  static deserializeBinaryFromReader(message: GenderChange, reader: jspb.BinaryReader): GenderChange;
}

export namespace GenderChange {
  export type AsObject = {
    gender: string,
  }
}

export class BirthdateChange extends jspb.Message {
  getBirthdate(): string;
  setBirthdate(value: string): BirthdateChange;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BirthdateChange.AsObject;
  static toObject(includeInstance: boolean, msg: BirthdateChange): BirthdateChange.AsObject;
  static serializeBinaryToWriter(message: BirthdateChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BirthdateChange;
  static deserializeBinaryFromReader(message: BirthdateChange, reader: jspb.BinaryReader): BirthdateChange;
}

export namespace BirthdateChange {
  export type AsObject = {
    birthdate: string,
  }
}

export class FriendRequestCreate extends jspb.Message {
  getOtherUser(): api_pb.User | undefined;
  setOtherUser(value?: api_pb.User): FriendRequestCreate;
  hasOtherUser(): boolean;
  clearOtherUser(): FriendRequestCreate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FriendRequestCreate.AsObject;
  static toObject(includeInstance: boolean, msg: FriendRequestCreate): FriendRequestCreate.AsObject;
  static serializeBinaryToWriter(message: FriendRequestCreate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FriendRequestCreate;
  static deserializeBinaryFromReader(message: FriendRequestCreate, reader: jspb.BinaryReader): FriendRequestCreate;
}

export namespace FriendRequestCreate {
  export type AsObject = {
    otherUser?: api_pb.User.AsObject,
  }
}

export class FriendRequestAccept extends jspb.Message {
  getOtherUser(): api_pb.User | undefined;
  setOtherUser(value?: api_pb.User): FriendRequestAccept;
  hasOtherUser(): boolean;
  clearOtherUser(): FriendRequestAccept;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FriendRequestAccept.AsObject;
  static toObject(includeInstance: boolean, msg: FriendRequestAccept): FriendRequestAccept.AsObject;
  static serializeBinaryToWriter(message: FriendRequestAccept, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FriendRequestAccept;
  static deserializeBinaryFromReader(message: FriendRequestAccept, reader: jspb.BinaryReader): FriendRequestAccept;
}

export namespace FriendRequestAccept {
  export type AsObject = {
    otherUser?: api_pb.User.AsObject,
  }
}

export class EmailAddressChange extends jspb.Message {
  getNewEmail(): string;
  setNewEmail(value: string): EmailAddressChange;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EmailAddressChange.AsObject;
  static toObject(includeInstance: boolean, msg: EmailAddressChange): EmailAddressChange.AsObject;
  static serializeBinaryToWriter(message: EmailAddressChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EmailAddressChange;
  static deserializeBinaryFromReader(message: EmailAddressChange, reader: jspb.BinaryReader): EmailAddressChange;
}

export namespace EmailAddressChange {
  export type AsObject = {
    newEmail: string,
  }
}

export class DonationReceived extends jspb.Message {
  getAmount(): number;
  setAmount(value: number): DonationReceived;

  getReceiptUrl(): string;
  setReceiptUrl(value: string): DonationReceived;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DonationReceived.AsObject;
  static toObject(includeInstance: boolean, msg: DonationReceived): DonationReceived.AsObject;
  static serializeBinaryToWriter(message: DonationReceived, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DonationReceived;
  static deserializeBinaryFromReader(message: DonationReceived, reader: jspb.BinaryReader): DonationReceived;
}

export namespace DonationReceived {
  export type AsObject = {
    amount: number,
    receiptUrl: string,
  }
}

export class PasswordResetStart extends jspb.Message {
  getPasswordResetToken(): string;
  setPasswordResetToken(value: string): PasswordResetStart;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PasswordResetStart.AsObject;
  static toObject(includeInstance: boolean, msg: PasswordResetStart): PasswordResetStart.AsObject;
  static serializeBinaryToWriter(message: PasswordResetStart, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PasswordResetStart;
  static deserializeBinaryFromReader(message: PasswordResetStart, reader: jspb.BinaryReader): PasswordResetStart;
}

export namespace PasswordResetStart {
  export type AsObject = {
    passwordResetToken: string,
  }
}

export class AccountDeletionStart extends jspb.Message {
  getDeletionToken(): string;
  setDeletionToken(value: string): AccountDeletionStart;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AccountDeletionStart.AsObject;
  static toObject(includeInstance: boolean, msg: AccountDeletionStart): AccountDeletionStart.AsObject;
  static serializeBinaryToWriter(message: AccountDeletionStart, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AccountDeletionStart;
  static deserializeBinaryFromReader(message: AccountDeletionStart, reader: jspb.BinaryReader): AccountDeletionStart;
}

export namespace AccountDeletionStart {
  export type AsObject = {
    deletionToken: string,
  }
}

export class AccountDeletionComplete extends jspb.Message {
  getUndeleteToken(): string;
  setUndeleteToken(value: string): AccountDeletionComplete;

  getUndeleteDays(): number;
  setUndeleteDays(value: number): AccountDeletionComplete;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AccountDeletionComplete.AsObject;
  static toObject(includeInstance: boolean, msg: AccountDeletionComplete): AccountDeletionComplete.AsObject;
  static serializeBinaryToWriter(message: AccountDeletionComplete, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AccountDeletionComplete;
  static deserializeBinaryFromReader(message: AccountDeletionComplete, reader: jspb.BinaryReader): AccountDeletionComplete;
}

export namespace AccountDeletionComplete {
  export type AsObject = {
    undeleteToken: string,
    undeleteDays: number,
  }
}

export class ApiKeyCreate extends jspb.Message {
  getApiKey(): string;
  setApiKey(value: string): ApiKeyCreate;

  getExpiry(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setExpiry(value?: google_protobuf_timestamp_pb.Timestamp): ApiKeyCreate;
  hasExpiry(): boolean;
  clearExpiry(): ApiKeyCreate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ApiKeyCreate.AsObject;
  static toObject(includeInstance: boolean, msg: ApiKeyCreate): ApiKeyCreate.AsObject;
  static serializeBinaryToWriter(message: ApiKeyCreate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ApiKeyCreate;
  static deserializeBinaryFromReader(message: ApiKeyCreate, reader: jspb.BinaryReader): ApiKeyCreate;
}

export namespace ApiKeyCreate {
  export type AsObject = {
    apiKey: string,
    expiry?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class EventInviteOrganizer extends jspb.Message {
  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): EventInviteOrganizer;
  hasEvent(): boolean;
  clearEvent(): EventInviteOrganizer;

  getInvitingUser(): api_pb.User | undefined;
  setInvitingUser(value?: api_pb.User): EventInviteOrganizer;
  hasInvitingUser(): boolean;
  clearInvitingUser(): EventInviteOrganizer;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventInviteOrganizer.AsObject;
  static toObject(includeInstance: boolean, msg: EventInviteOrganizer): EventInviteOrganizer.AsObject;
  static serializeBinaryToWriter(message: EventInviteOrganizer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventInviteOrganizer;
  static deserializeBinaryFromReader(message: EventInviteOrganizer, reader: jspb.BinaryReader): EventInviteOrganizer;
}

export namespace EventInviteOrganizer {
  export type AsObject = {
    event?: events_pb.Event.AsObject,
    invitingUser?: api_pb.User.AsObject,
  }
}

export class EventCreate extends jspb.Message {
  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): EventCreate;
  hasEvent(): boolean;
  clearEvent(): EventCreate;

  getInvitingUser(): api_pb.User | undefined;
  setInvitingUser(value?: api_pb.User): EventCreate;
  hasInvitingUser(): boolean;
  clearInvitingUser(): EventCreate;

  getNearby(): boolean;
  setNearby(value: boolean): EventCreate;

  getInCommunity(): communities_pb.Community | undefined;
  setInCommunity(value?: communities_pb.Community): EventCreate;
  hasInCommunity(): boolean;
  clearInCommunity(): EventCreate;

  getNotificationReasonCase(): EventCreate.NotificationReasonCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventCreate.AsObject;
  static toObject(includeInstance: boolean, msg: EventCreate): EventCreate.AsObject;
  static serializeBinaryToWriter(message: EventCreate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventCreate;
  static deserializeBinaryFromReader(message: EventCreate, reader: jspb.BinaryReader): EventCreate;
}

export namespace EventCreate {
  export type AsObject = {
    event?: events_pb.Event.AsObject,
    invitingUser?: api_pb.User.AsObject,
    nearby: boolean,
    inCommunity?: communities_pb.Community.AsObject,
  }

  export enum NotificationReasonCase { 
    NOTIFICATION_REASON_NOT_SET = 0,
    NEARBY = 3,
    IN_COMMUNITY = 4,
  }
}

export class EventUpdate extends jspb.Message {
  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): EventUpdate;
  hasEvent(): boolean;
  clearEvent(): EventUpdate;

  getUpdatingUser(): api_pb.User | undefined;
  setUpdatingUser(value?: api_pb.User): EventUpdate;
  hasUpdatingUser(): boolean;
  clearUpdatingUser(): EventUpdate;

  getUpdatedItemsList(): Array<string>;
  setUpdatedItemsList(value: Array<string>): EventUpdate;
  clearUpdatedItemsList(): EventUpdate;
  addUpdatedItems(value: string, index?: number): EventUpdate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: EventUpdate): EventUpdate.AsObject;
  static serializeBinaryToWriter(message: EventUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventUpdate;
  static deserializeBinaryFromReader(message: EventUpdate, reader: jspb.BinaryReader): EventUpdate;
}

export namespace EventUpdate {
  export type AsObject = {
    event?: events_pb.Event.AsObject,
    updatingUser?: api_pb.User.AsObject,
    updatedItemsList: Array<string>,
  }
}

export class EventCancel extends jspb.Message {
  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): EventCancel;
  hasEvent(): boolean;
  clearEvent(): EventCancel;

  getCancellingUser(): api_pb.User | undefined;
  setCancellingUser(value?: api_pb.User): EventCancel;
  hasCancellingUser(): boolean;
  clearCancellingUser(): EventCancel;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventCancel.AsObject;
  static toObject(includeInstance: boolean, msg: EventCancel): EventCancel.AsObject;
  static serializeBinaryToWriter(message: EventCancel, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventCancel;
  static deserializeBinaryFromReader(message: EventCancel, reader: jspb.BinaryReader): EventCancel;
}

export namespace EventCancel {
  export type AsObject = {
    event?: events_pb.Event.AsObject,
    cancellingUser?: api_pb.User.AsObject,
  }
}

export class EventDelete extends jspb.Message {
  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): EventDelete;
  hasEvent(): boolean;
  clearEvent(): EventDelete;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventDelete.AsObject;
  static toObject(includeInstance: boolean, msg: EventDelete): EventDelete.AsObject;
  static serializeBinaryToWriter(message: EventDelete, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventDelete;
  static deserializeBinaryFromReader(message: EventDelete, reader: jspb.BinaryReader): EventDelete;
}

export namespace EventDelete {
  export type AsObject = {
    event?: events_pb.Event.AsObject,
  }
}

export class ChatMessage extends jspb.Message {
  getAuthor(): api_pb.User | undefined;
  setAuthor(value?: api_pb.User): ChatMessage;
  hasAuthor(): boolean;
  clearAuthor(): ChatMessage;

  getMessage(): string;
  setMessage(value: string): ChatMessage;

  getText(): string;
  setText(value: string): ChatMessage;

  getGroupChatId(): number;
  setGroupChatId(value: number): ChatMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChatMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ChatMessage): ChatMessage.AsObject;
  static serializeBinaryToWriter(message: ChatMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChatMessage;
  static deserializeBinaryFromReader(message: ChatMessage, reader: jspb.BinaryReader): ChatMessage;
}

export namespace ChatMessage {
  export type AsObject = {
    author?: api_pb.User.AsObject,
    message: string,
    text: string,
    groupChatId: number,
  }
}

export class ChatMissedMessages extends jspb.Message {
  getMessagesList(): Array<ChatMessage>;
  setMessagesList(value: Array<ChatMessage>): ChatMissedMessages;
  clearMessagesList(): ChatMissedMessages;
  addMessages(value?: ChatMessage, index?: number): ChatMessage;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChatMissedMessages.AsObject;
  static toObject(includeInstance: boolean, msg: ChatMissedMessages): ChatMissedMessages.AsObject;
  static serializeBinaryToWriter(message: ChatMissedMessages, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChatMissedMessages;
  static deserializeBinaryFromReader(message: ChatMissedMessages, reader: jspb.BinaryReader): ChatMissedMessages;
}

export namespace ChatMissedMessages {
  export type AsObject = {
    messagesList: Array<ChatMessage.AsObject>,
  }
}

export class ReferenceReceiveFriend extends jspb.Message {
  getFromUser(): api_pb.User | undefined;
  setFromUser(value?: api_pb.User): ReferenceReceiveFriend;
  hasFromUser(): boolean;
  clearFromUser(): ReferenceReceiveFriend;

  getText(): string;
  setText(value: string): ReferenceReceiveFriend;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReferenceReceiveFriend.AsObject;
  static toObject(includeInstance: boolean, msg: ReferenceReceiveFriend): ReferenceReceiveFriend.AsObject;
  static serializeBinaryToWriter(message: ReferenceReceiveFriend, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReferenceReceiveFriend;
  static deserializeBinaryFromReader(message: ReferenceReceiveFriend, reader: jspb.BinaryReader): ReferenceReceiveFriend;
}

export namespace ReferenceReceiveFriend {
  export type AsObject = {
    fromUser?: api_pb.User.AsObject,
    text: string,
  }
}

export class ReferenceReceiveHostRequest extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): ReferenceReceiveHostRequest;

  getFromUser(): api_pb.User | undefined;
  setFromUser(value?: api_pb.User): ReferenceReceiveHostRequest;
  hasFromUser(): boolean;
  clearFromUser(): ReferenceReceiveHostRequest;

  getText(): string;
  setText(value: string): ReferenceReceiveHostRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReferenceReceiveHostRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ReferenceReceiveHostRequest): ReferenceReceiveHostRequest.AsObject;
  static serializeBinaryToWriter(message: ReferenceReceiveHostRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReferenceReceiveHostRequest;
  static deserializeBinaryFromReader(message: ReferenceReceiveHostRequest, reader: jspb.BinaryReader): ReferenceReceiveHostRequest;
}

export namespace ReferenceReceiveHostRequest {
  export type AsObject = {
    hostRequestId: number,
    fromUser?: api_pb.User.AsObject,
    text: string,
  }
}

export class ReferenceReminder extends jspb.Message {
  getHostRequestId(): number;
  setHostRequestId(value: number): ReferenceReminder;

  getOtherUser(): api_pb.User | undefined;
  setOtherUser(value?: api_pb.User): ReferenceReminder;
  hasOtherUser(): boolean;
  clearOtherUser(): ReferenceReminder;

  getDaysLeft(): number;
  setDaysLeft(value: number): ReferenceReminder;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReferenceReminder.AsObject;
  static toObject(includeInstance: boolean, msg: ReferenceReminder): ReferenceReminder.AsObject;
  static serializeBinaryToWriter(message: ReferenceReminder, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReferenceReminder;
  static deserializeBinaryFromReader(message: ReferenceReminder, reader: jspb.BinaryReader): ReferenceReminder;
}

export namespace ReferenceReminder {
  export type AsObject = {
    hostRequestId: number,
    otherUser?: api_pb.User.AsObject,
    daysLeft: number,
  }
}

export class VerificationSVFail extends jspb.Message {
  getReason(): SVFailReason;
  setReason(value: SVFailReason): VerificationSVFail;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VerificationSVFail.AsObject;
  static toObject(includeInstance: boolean, msg: VerificationSVFail): VerificationSVFail.AsObject;
  static serializeBinaryToWriter(message: VerificationSVFail, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VerificationSVFail;
  static deserializeBinaryFromReader(message: VerificationSVFail, reader: jspb.BinaryReader): VerificationSVFail;
}

export namespace VerificationSVFail {
  export type AsObject = {
    reason: SVFailReason,
  }
}

export class EventComment extends jspb.Message {
  getReply(): threads_pb.Reply | undefined;
  setReply(value?: threads_pb.Reply): EventComment;
  hasReply(): boolean;
  clearReply(): EventComment;

  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): EventComment;
  hasEvent(): boolean;
  clearEvent(): EventComment;

  getAuthor(): api_pb.User | undefined;
  setAuthor(value?: api_pb.User): EventComment;
  hasAuthor(): boolean;
  clearAuthor(): EventComment;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EventComment.AsObject;
  static toObject(includeInstance: boolean, msg: EventComment): EventComment.AsObject;
  static serializeBinaryToWriter(message: EventComment, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EventComment;
  static deserializeBinaryFromReader(message: EventComment, reader: jspb.BinaryReader): EventComment;
}

export namespace EventComment {
  export type AsObject = {
    reply?: threads_pb.Reply.AsObject,
    event?: events_pb.Event.AsObject,
    author?: api_pb.User.AsObject,
  }
}

export class DiscussionCreate extends jspb.Message {
  getDiscussion(): discussions_pb.Discussion | undefined;
  setDiscussion(value?: discussions_pb.Discussion): DiscussionCreate;
  hasDiscussion(): boolean;
  clearDiscussion(): DiscussionCreate;

  getAuthor(): api_pb.User | undefined;
  setAuthor(value?: api_pb.User): DiscussionCreate;
  hasAuthor(): boolean;
  clearAuthor(): DiscussionCreate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DiscussionCreate.AsObject;
  static toObject(includeInstance: boolean, msg: DiscussionCreate): DiscussionCreate.AsObject;
  static serializeBinaryToWriter(message: DiscussionCreate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DiscussionCreate;
  static deserializeBinaryFromReader(message: DiscussionCreate, reader: jspb.BinaryReader): DiscussionCreate;
}

export namespace DiscussionCreate {
  export type AsObject = {
    discussion?: discussions_pb.Discussion.AsObject,
    author?: api_pb.User.AsObject,
  }
}

export class DiscussionComment extends jspb.Message {
  getReply(): threads_pb.Reply | undefined;
  setReply(value?: threads_pb.Reply): DiscussionComment;
  hasReply(): boolean;
  clearReply(): DiscussionComment;

  getDiscussion(): discussions_pb.Discussion | undefined;
  setDiscussion(value?: discussions_pb.Discussion): DiscussionComment;
  hasDiscussion(): boolean;
  clearDiscussion(): DiscussionComment;

  getAuthor(): api_pb.User | undefined;
  setAuthor(value?: api_pb.User): DiscussionComment;
  hasAuthor(): boolean;
  clearAuthor(): DiscussionComment;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DiscussionComment.AsObject;
  static toObject(includeInstance: boolean, msg: DiscussionComment): DiscussionComment.AsObject;
  static serializeBinaryToWriter(message: DiscussionComment, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DiscussionComment;
  static deserializeBinaryFromReader(message: DiscussionComment, reader: jspb.BinaryReader): DiscussionComment;
}

export namespace DiscussionComment {
  export type AsObject = {
    reply?: threads_pb.Reply.AsObject,
    discussion?: discussions_pb.Discussion.AsObject,
    author?: api_pb.User.AsObject,
  }
}

export class ThreadReply extends jspb.Message {
  getReply(): threads_pb.Reply | undefined;
  setReply(value?: threads_pb.Reply): ThreadReply;
  hasReply(): boolean;
  clearReply(): ThreadReply;

  getAuthor(): api_pb.User | undefined;
  setAuthor(value?: api_pb.User): ThreadReply;
  hasAuthor(): boolean;
  clearAuthor(): ThreadReply;

  getEvent(): events_pb.Event | undefined;
  setEvent(value?: events_pb.Event): ThreadReply;
  hasEvent(): boolean;
  clearEvent(): ThreadReply;

  getDiscussion(): discussions_pb.Discussion | undefined;
  setDiscussion(value?: discussions_pb.Discussion): ThreadReply;
  hasDiscussion(): boolean;
  clearDiscussion(): ThreadReply;

  getReplyParentCase(): ThreadReply.ReplyParentCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ThreadReply.AsObject;
  static toObject(includeInstance: boolean, msg: ThreadReply): ThreadReply.AsObject;
  static serializeBinaryToWriter(message: ThreadReply, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ThreadReply;
  static deserializeBinaryFromReader(message: ThreadReply, reader: jspb.BinaryReader): ThreadReply;
}

export namespace ThreadReply {
  export type AsObject = {
    reply?: threads_pb.Reply.AsObject,
    author?: api_pb.User.AsObject,
    event?: events_pb.Event.AsObject,
    discussion?: discussions_pb.Discussion.AsObject,
  }

  export enum ReplyParentCase { 
    REPLY_PARENT_NOT_SET = 0,
    EVENT = 3,
    DISCUSSION = 4,
  }
}

export class ActivenessProbe extends jspb.Message {
  getReminderNumber(): number;
  setReminderNumber(value: number): ActivenessProbe;

  getDeadline(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setDeadline(value?: google_protobuf_timestamp_pb.Timestamp): ActivenessProbe;
  hasDeadline(): boolean;
  clearDeadline(): ActivenessProbe;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ActivenessProbe.AsObject;
  static toObject(includeInstance: boolean, msg: ActivenessProbe): ActivenessProbe.AsObject;
  static serializeBinaryToWriter(message: ActivenessProbe, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ActivenessProbe;
  static deserializeBinaryFromReader(message: ActivenessProbe, reader: jspb.BinaryReader): ActivenessProbe;
}

export namespace ActivenessProbe {
  export type AsObject = {
    reminderNumber: number,
    deadline?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class GeneralNewBlogPost extends jspb.Message {
  getUrl(): string;
  setUrl(value: string): GeneralNewBlogPost;

  getTitle(): string;
  setTitle(value: string): GeneralNewBlogPost;

  getBlurb(): string;
  setBlurb(value: string): GeneralNewBlogPost;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GeneralNewBlogPost.AsObject;
  static toObject(includeInstance: boolean, msg: GeneralNewBlogPost): GeneralNewBlogPost.AsObject;
  static serializeBinaryToWriter(message: GeneralNewBlogPost, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GeneralNewBlogPost;
  static deserializeBinaryFromReader(message: GeneralNewBlogPost, reader: jspb.BinaryReader): GeneralNewBlogPost;
}

export namespace GeneralNewBlogPost {
  export type AsObject = {
    url: string,
    title: string,
    blurb: string,
  }
}

export enum SVFailReason { 
  SV_FAIL_REASON_UNKNOWN = 0,
  SV_FAIL_REASON_WRONG_BIRTHDATE_OR_GENDER = 1,
  SV_FAIL_REASON_NOT_A_PASSPORT = 2,
  SV_FAIL_REASON_DUPLICATE = 3,
}
