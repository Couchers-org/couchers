import * as jspb from "google-protobuf"

import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';

export class SearchReq extends jspb.Message {
  getQuery(): string;
  setQuery(value: string): SearchReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchReq.AsObject;
  static toObject(includeInstance: boolean, msg: SearchReq): SearchReq.AsObject;
  static serializeBinaryToWriter(message: SearchReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchReq;
  static deserializeBinaryFromReader(message: SearchReq, reader: jspb.BinaryReader): SearchReq;
}

export namespace SearchReq {
  export type AsObject = {
    query: string,
  }
}

export class SearchRes extends jspb.Message {
  getUsersList(): Array<User>;
  setUsersList(value: Array<User>): SearchRes;
  clearUsersList(): SearchRes;
  addUsers(value?: User, index?: number): User;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SearchRes.AsObject;
  static toObject(includeInstance: boolean, msg: SearchRes): SearchRes.AsObject;
  static serializeBinaryToWriter(message: SearchRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SearchRes;
  static deserializeBinaryFromReader(message: SearchRes, reader: jspb.BinaryReader): SearchRes;
}

export namespace SearchRes {
  export type AsObject = {
    usersList: Array<User.AsObject>,
  }
}

export class SendFriendRequestReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): SendFriendRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendFriendRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: SendFriendRequestReq): SendFriendRequestReq.AsObject;
  static serializeBinaryToWriter(message: SendFriendRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendFriendRequestReq;
  static deserializeBinaryFromReader(message: SendFriendRequestReq, reader: jspb.BinaryReader): SendFriendRequestReq;
}

export namespace SendFriendRequestReq {
  export type AsObject = {
    user: string,
  }
}

export class FriendRequest extends jspb.Message {
  getFriendRequestId(): number;
  setFriendRequestId(value: number): FriendRequest;

  getState(): FriendRequest.FriendRequestStatus;
  setState(value: FriendRequest.FriendRequestStatus): FriendRequest;

  getUser(): string;
  setUser(value: string): FriendRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FriendRequest.AsObject;
  static toObject(includeInstance: boolean, msg: FriendRequest): FriendRequest.AsObject;
  static serializeBinaryToWriter(message: FriendRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FriendRequest;
  static deserializeBinaryFromReader(message: FriendRequest, reader: jspb.BinaryReader): FriendRequest;
}

export namespace FriendRequest {
  export type AsObject = {
    friendRequestId: number,
    state: FriendRequest.FriendRequestStatus,
    user: string,
  }

  export enum FriendRequestStatus { 
    PENDING = 0,
    ACCEPTED = 1,
  }
}

export class RespondFriendRequestReq extends jspb.Message {
  getFriendRequestId(): number;
  setFriendRequestId(value: number): RespondFriendRequestReq;

  getAccept(): boolean;
  setAccept(value: boolean): RespondFriendRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RespondFriendRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: RespondFriendRequestReq): RespondFriendRequestReq.AsObject;
  static serializeBinaryToWriter(message: RespondFriendRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RespondFriendRequestReq;
  static deserializeBinaryFromReader(message: RespondFriendRequestReq, reader: jspb.BinaryReader): RespondFriendRequestReq;
}

export namespace RespondFriendRequestReq {
  export type AsObject = {
    friendRequestId: number,
    accept: boolean,
  }
}

export class CancelFriendRequestReq extends jspb.Message {
  getFriendRequestId(): number;
  setFriendRequestId(value: number): CancelFriendRequestReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CancelFriendRequestReq.AsObject;
  static toObject(includeInstance: boolean, msg: CancelFriendRequestReq): CancelFriendRequestReq.AsObject;
  static serializeBinaryToWriter(message: CancelFriendRequestReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CancelFriendRequestReq;
  static deserializeBinaryFromReader(message: CancelFriendRequestReq, reader: jspb.BinaryReader): CancelFriendRequestReq;
}

export namespace CancelFriendRequestReq {
  export type AsObject = {
    friendRequestId: number,
  }
}

export class ListFriendRequestsRes extends jspb.Message {
  getSentList(): Array<FriendRequest>;
  setSentList(value: Array<FriendRequest>): ListFriendRequestsRes;
  clearSentList(): ListFriendRequestsRes;
  addSent(value?: FriendRequest, index?: number): FriendRequest;

  getReceivedList(): Array<FriendRequest>;
  setReceivedList(value: Array<FriendRequest>): ListFriendRequestsRes;
  clearReceivedList(): ListFriendRequestsRes;
  addReceived(value?: FriendRequest, index?: number): FriendRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFriendRequestsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListFriendRequestsRes): ListFriendRequestsRes.AsObject;
  static serializeBinaryToWriter(message: ListFriendRequestsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFriendRequestsRes;
  static deserializeBinaryFromReader(message: ListFriendRequestsRes, reader: jspb.BinaryReader): ListFriendRequestsRes;
}

export namespace ListFriendRequestsRes {
  export type AsObject = {
    sentList: Array<FriendRequest.AsObject>,
    receivedList: Array<FriendRequest.AsObject>,
  }
}

export class ListFriendsRes extends jspb.Message {
  getUsersList(): Array<string>;
  setUsersList(value: Array<string>): ListFriendsRes;
  clearUsersList(): ListFriendsRes;
  addUsers(value: string, index?: number): ListFriendsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFriendsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListFriendsRes): ListFriendsRes.AsObject;
  static serializeBinaryToWriter(message: ListFriendsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFriendsRes;
  static deserializeBinaryFromReader(message: ListFriendsRes, reader: jspb.BinaryReader): ListFriendsRes;
}

export namespace ListFriendsRes {
  export type AsObject = {
    usersList: Array<string>,
  }
}

export class PingReq extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingReq.AsObject;
  static toObject(includeInstance: boolean, msg: PingReq): PingReq.AsObject;
  static serializeBinaryToWriter(message: PingReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PingReq;
  static deserializeBinaryFromReader(message: PingReq, reader: jspb.BinaryReader): PingReq;
}

export namespace PingReq {
  export type AsObject = {
  }
}

export class PingRes extends jspb.Message {
  getUserId(): number;
  setUserId(value: number): PingRes;

  getUsername(): string;
  setUsername(value: string): PingRes;

  getName(): string;
  setName(value: string): PingRes;

  getColor(): string;
  setColor(value: string): PingRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PingRes.AsObject;
  static toObject(includeInstance: boolean, msg: PingRes): PingRes.AsObject;
  static serializeBinaryToWriter(message: PingRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PingRes;
  static deserializeBinaryFromReader(message: PingRes, reader: jspb.BinaryReader): PingRes;
}

export namespace PingRes {
  export type AsObject = {
    userId: number,
    username: string,
    name: string,
    color: string,
  }
}

export class User extends jspb.Message {
  getUsername(): string;
  setUsername(value: string): User;

  getName(): string;
  setName(value: string): User;

  getCity(): string;
  setCity(value: string): User;

  getVerification(): number;
  setVerification(value: number): User;

  getCommunityStanding(): number;
  setCommunityStanding(value: number): User;

  getNumReferences(): number;
  setNumReferences(value: number): User;

  getGender(): string;
  setGender(value: string): User;

  getAge(): number;
  setAge(value: number): User;

  getColor(): string;
  setColor(value: string): User;

  getJoined(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setJoined(value?: google_protobuf_timestamp_pb.Timestamp): User;
  hasJoined(): boolean;
  clearJoined(): User;

  getLastActive(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastActive(value?: google_protobuf_timestamp_pb.Timestamp): User;
  hasLastActive(): boolean;
  clearLastActive(): User;

  getOccupation(): string;
  setOccupation(value: string): User;

  getAboutMe(): string;
  setAboutMe(value: string): User;

  getAboutPlace(): string;
  setAboutPlace(value: string): User;

  getLanguagesList(): Array<string>;
  setLanguagesList(value: Array<string>): User;
  clearLanguagesList(): User;
  addLanguages(value: string, index?: number): User;

  getCountriesVisitedList(): Array<string>;
  setCountriesVisitedList(value: Array<string>): User;
  clearCountriesVisitedList(): User;
  addCountriesVisited(value: string, index?: number): User;

  getCountriesLivedList(): Array<string>;
  setCountriesLivedList(value: Array<string>): User;
  clearCountriesLivedList(): User;
  addCountriesLived(value: string, index?: number): User;

  getFriends(): User.FriendshipStatus;
  setFriends(value: User.FriendshipStatus): User;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): User.AsObject;
  static toObject(includeInstance: boolean, msg: User): User.AsObject;
  static serializeBinaryToWriter(message: User, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): User;
  static deserializeBinaryFromReader(message: User, reader: jspb.BinaryReader): User;
}

export namespace User {
  export type AsObject = {
    username: string,
    name: string,
    city: string,
    verification: number,
    communityStanding: number,
    numReferences: number,
    gender: string,
    age: number,
    color: string,
    joined?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastActive?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    occupation: string,
    aboutMe: string,
    aboutPlace: string,
    languagesList: Array<string>,
    countriesVisitedList: Array<string>,
    countriesLivedList: Array<string>,
    friends: User.FriendshipStatus,
  }

  export enum FriendshipStatus { 
    NOT_FRIENDS = 0,
    FRIENDS = 1,
    PENDING = 2,
    NA = 3,
  }
}

export class GetUserReq extends jspb.Message {
  getUser(): string;
  setUser(value: string): GetUserReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetUserReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetUserReq): GetUserReq.AsObject;
  static serializeBinaryToWriter(message: GetUserReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetUserReq;
  static deserializeBinaryFromReader(message: GetUserReq, reader: jspb.BinaryReader): GetUserReq;
}

export namespace GetUserReq {
  export type AsObject = {
    user: string,
  }
}

export class RepeatedStringValue extends jspb.Message {
  getExists(): boolean;
  setExists(value: boolean): RepeatedStringValue;

  getValueList(): Array<string>;
  setValueList(value: Array<string>): RepeatedStringValue;
  clearValueList(): RepeatedStringValue;
  addValue(value: string, index?: number): RepeatedStringValue;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RepeatedStringValue.AsObject;
  static toObject(includeInstance: boolean, msg: RepeatedStringValue): RepeatedStringValue.AsObject;
  static serializeBinaryToWriter(message: RepeatedStringValue, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RepeatedStringValue;
  static deserializeBinaryFromReader(message: RepeatedStringValue, reader: jspb.BinaryReader): RepeatedStringValue;
}

export namespace RepeatedStringValue {
  export type AsObject = {
    exists: boolean,
    valueList: Array<string>,
  }
}

export class UpdateProfileReq extends jspb.Message {
  getName(): google_protobuf_wrappers_pb.StringValue | undefined;
  setName(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasName(): boolean;
  clearName(): UpdateProfileReq;

  getCity(): google_protobuf_wrappers_pb.StringValue | undefined;
  setCity(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasCity(): boolean;
  clearCity(): UpdateProfileReq;

  getGender(): google_protobuf_wrappers_pb.StringValue | undefined;
  setGender(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasGender(): boolean;
  clearGender(): UpdateProfileReq;

  getOccupation(): google_protobuf_wrappers_pb.StringValue | undefined;
  setOccupation(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasOccupation(): boolean;
  clearOccupation(): UpdateProfileReq;

  getAboutMe(): google_protobuf_wrappers_pb.StringValue | undefined;
  setAboutMe(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasAboutMe(): boolean;
  clearAboutMe(): UpdateProfileReq;

  getAboutPlace(): google_protobuf_wrappers_pb.StringValue | undefined;
  setAboutPlace(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasAboutPlace(): boolean;
  clearAboutPlace(): UpdateProfileReq;

  getColor(): google_protobuf_wrappers_pb.StringValue | undefined;
  setColor(value?: google_protobuf_wrappers_pb.StringValue): UpdateProfileReq;
  hasColor(): boolean;
  clearColor(): UpdateProfileReq;

  getLanguages(): RepeatedStringValue | undefined;
  setLanguages(value?: RepeatedStringValue): UpdateProfileReq;
  hasLanguages(): boolean;
  clearLanguages(): UpdateProfileReq;

  getCountriesVisited(): RepeatedStringValue | undefined;
  setCountriesVisited(value?: RepeatedStringValue): UpdateProfileReq;
  hasCountriesVisited(): boolean;
  clearCountriesVisited(): UpdateProfileReq;

  getCountriesLived(): RepeatedStringValue | undefined;
  setCountriesLived(value?: RepeatedStringValue): UpdateProfileReq;
  hasCountriesLived(): boolean;
  clearCountriesLived(): UpdateProfileReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateProfileReq.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateProfileReq): UpdateProfileReq.AsObject;
  static serializeBinaryToWriter(message: UpdateProfileReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateProfileReq;
  static deserializeBinaryFromReader(message: UpdateProfileReq, reader: jspb.BinaryReader): UpdateProfileReq;
}

export namespace UpdateProfileReq {
  export type AsObject = {
    name?: google_protobuf_wrappers_pb.StringValue.AsObject,
    city?: google_protobuf_wrappers_pb.StringValue.AsObject,
    gender?: google_protobuf_wrappers_pb.StringValue.AsObject,
    occupation?: google_protobuf_wrappers_pb.StringValue.AsObject,
    aboutMe?: google_protobuf_wrappers_pb.StringValue.AsObject,
    aboutPlace?: google_protobuf_wrappers_pb.StringValue.AsObject,
    color?: google_protobuf_wrappers_pb.StringValue.AsObject,
    languages?: RepeatedStringValue.AsObject,
    countriesVisited?: RepeatedStringValue.AsObject,
    countriesLived?: RepeatedStringValue.AsObject,
  }
}

export class UpdateProfileRes extends jspb.Message {
  getUpdatedName(): boolean;
  setUpdatedName(value: boolean): UpdateProfileRes;

  getUpdatedCity(): boolean;
  setUpdatedCity(value: boolean): UpdateProfileRes;

  getUpdatedGender(): boolean;
  setUpdatedGender(value: boolean): UpdateProfileRes;

  getUpdatedOccupation(): boolean;
  setUpdatedOccupation(value: boolean): UpdateProfileRes;

  getUpdatedAboutMe(): boolean;
  setUpdatedAboutMe(value: boolean): UpdateProfileRes;

  getUpdatedAboutPlace(): boolean;
  setUpdatedAboutPlace(value: boolean): UpdateProfileRes;

  getUpdatedColor(): boolean;
  setUpdatedColor(value: boolean): UpdateProfileRes;

  getUpdatedLanguages(): boolean;
  setUpdatedLanguages(value: boolean): UpdateProfileRes;

  getUpdatedCountriesVisited(): boolean;
  setUpdatedCountriesVisited(value: boolean): UpdateProfileRes;

  getUpdatedCountriesLived(): boolean;
  setUpdatedCountriesLived(value: boolean): UpdateProfileRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateProfileRes.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateProfileRes): UpdateProfileRes.AsObject;
  static serializeBinaryToWriter(message: UpdateProfileRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateProfileRes;
  static deserializeBinaryFromReader(message: UpdateProfileRes, reader: jspb.BinaryReader): UpdateProfileRes;
}

export namespace UpdateProfileRes {
  export type AsObject = {
    updatedName: boolean,
    updatedCity: boolean,
    updatedGender: boolean,
    updatedOccupation: boolean,
    updatedAboutMe: boolean,
    updatedAboutPlace: boolean,
    updatedColor: boolean,
    updatedLanguages: boolean,
    updatedCountriesVisited: boolean,
    updatedCountriesLived: boolean,
  }
}

export class SSOReq extends jspb.Message {
  getSso(): string;
  setSso(value: string): SSOReq;

  getSig(): string;
  setSig(value: string): SSOReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SSOReq.AsObject;
  static toObject(includeInstance: boolean, msg: SSOReq): SSOReq.AsObject;
  static serializeBinaryToWriter(message: SSOReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SSOReq;
  static deserializeBinaryFromReader(message: SSOReq, reader: jspb.BinaryReader): SSOReq;
}

export namespace SSOReq {
  export type AsObject = {
    sso: string,
    sig: string,
  }
}

export class SSORes extends jspb.Message {
  getRedirectUrl(): string;
  setRedirectUrl(value: string): SSORes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SSORes.AsObject;
  static toObject(includeInstance: boolean, msg: SSORes): SSORes.AsObject;
  static serializeBinaryToWriter(message: SSORes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SSORes;
  static deserializeBinaryFromReader(message: SSORes, reader: jspb.BinaryReader): SSORes;
}

export namespace SSORes {
  export type AsObject = {
    redirectUrl: string,
  }
}

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
