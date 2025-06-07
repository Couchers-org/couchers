import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb'; // proto import: "google/protobuf/timestamp.proto"
import * as annotations_pb from './annotations_pb'; // proto import: "annotations.proto"


export class GetNotificationSettingsReq extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNotificationSettingsReq.AsObject;
  static toObject(includeInstance: boolean, msg: GetNotificationSettingsReq): GetNotificationSettingsReq.AsObject;
  static serializeBinaryToWriter(message: GetNotificationSettingsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNotificationSettingsReq;
  static deserializeBinaryFromReader(message: GetNotificationSettingsReq, reader: jspb.BinaryReader): GetNotificationSettingsReq;
}

export namespace GetNotificationSettingsReq {
  export type AsObject = {
  }
}

export class NotificationItem extends jspb.Message {
  getAction(): string;
  setAction(value: string): NotificationItem;

  getDescription(): string;
  setDescription(value: string): NotificationItem;

  getUserEditable(): boolean;
  setUserEditable(value: boolean): NotificationItem;

  getPush(): boolean;
  setPush(value: boolean): NotificationItem;

  getEmail(): boolean;
  setEmail(value: boolean): NotificationItem;

  getDigest(): boolean;
  setDigest(value: boolean): NotificationItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NotificationItem.AsObject;
  static toObject(includeInstance: boolean, msg: NotificationItem): NotificationItem.AsObject;
  static serializeBinaryToWriter(message: NotificationItem, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NotificationItem;
  static deserializeBinaryFromReader(message: NotificationItem, reader: jspb.BinaryReader): NotificationItem;
}

export namespace NotificationItem {
  export type AsObject = {
    action: string,
    description: string,
    userEditable: boolean,
    push: boolean,
    email: boolean,
    digest: boolean,
  }
}

export class NotificationTopic extends jspb.Message {
  getTopic(): string;
  setTopic(value: string): NotificationTopic;

  getName(): string;
  setName(value: string): NotificationTopic;

  getItemsList(): Array<NotificationItem>;
  setItemsList(value: Array<NotificationItem>): NotificationTopic;
  clearItemsList(): NotificationTopic;
  addItems(value?: NotificationItem, index?: number): NotificationItem;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NotificationTopic.AsObject;
  static toObject(includeInstance: boolean, msg: NotificationTopic): NotificationTopic.AsObject;
  static serializeBinaryToWriter(message: NotificationTopic, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NotificationTopic;
  static deserializeBinaryFromReader(message: NotificationTopic, reader: jspb.BinaryReader): NotificationTopic;
}

export namespace NotificationTopic {
  export type AsObject = {
    topic: string,
    name: string,
    itemsList: Array<NotificationItem.AsObject>,
  }
}

export class NotificationGroup extends jspb.Message {
  getHeading(): string;
  setHeading(value: string): NotificationGroup;

  getTopicsList(): Array<NotificationTopic>;
  setTopicsList(value: Array<NotificationTopic>): NotificationGroup;
  clearTopicsList(): NotificationGroup;
  addTopics(value?: NotificationTopic, index?: number): NotificationTopic;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NotificationGroup.AsObject;
  static toObject(includeInstance: boolean, msg: NotificationGroup): NotificationGroup.AsObject;
  static serializeBinaryToWriter(message: NotificationGroup, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NotificationGroup;
  static deserializeBinaryFromReader(message: NotificationGroup, reader: jspb.BinaryReader): NotificationGroup;
}

export namespace NotificationGroup {
  export type AsObject = {
    heading: string,
    topicsList: Array<NotificationTopic.AsObject>,
  }
}

export class SingleNotificationPreference extends jspb.Message {
  getTopic(): string;
  setTopic(value: string): SingleNotificationPreference;

  getAction(): string;
  setAction(value: string): SingleNotificationPreference;

  getDeliveryMethod(): string;
  setDeliveryMethod(value: string): SingleNotificationPreference;

  getEnabled(): boolean;
  setEnabled(value: boolean): SingleNotificationPreference;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SingleNotificationPreference.AsObject;
  static toObject(includeInstance: boolean, msg: SingleNotificationPreference): SingleNotificationPreference.AsObject;
  static serializeBinaryToWriter(message: SingleNotificationPreference, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SingleNotificationPreference;
  static deserializeBinaryFromReader(message: SingleNotificationPreference, reader: jspb.BinaryReader): SingleNotificationPreference;
}

export namespace SingleNotificationPreference {
  export type AsObject = {
    topic: string,
    action: string,
    deliveryMethod: string,
    enabled: boolean,
  }
}

export class GetNotificationSettingsRes extends jspb.Message {
  getDoNotEmailEnabled(): boolean;
  setDoNotEmailEnabled(value: boolean): GetNotificationSettingsRes;

  getEmailDigestEnabled(): boolean;
  setEmailDigestEnabled(value: boolean): GetNotificationSettingsRes;

  getGroupsList(): Array<NotificationGroup>;
  setGroupsList(value: Array<NotificationGroup>): GetNotificationSettingsRes;
  clearGroupsList(): GetNotificationSettingsRes;
  addGroups(value?: NotificationGroup, index?: number): NotificationGroup;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNotificationSettingsRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetNotificationSettingsRes): GetNotificationSettingsRes.AsObject;
  static serializeBinaryToWriter(message: GetNotificationSettingsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNotificationSettingsRes;
  static deserializeBinaryFromReader(message: GetNotificationSettingsRes, reader: jspb.BinaryReader): GetNotificationSettingsRes;
}

export namespace GetNotificationSettingsRes {
  export type AsObject = {
    doNotEmailEnabled: boolean,
    emailDigestEnabled: boolean,
    groupsList: Array<NotificationGroup.AsObject>,
  }
}

export class SetNotificationSettingsReq extends jspb.Message {
  getEnableDoNotEmail(): boolean;
  setEnableDoNotEmail(value: boolean): SetNotificationSettingsReq;

  getPreferencesList(): Array<SingleNotificationPreference>;
  setPreferencesList(value: Array<SingleNotificationPreference>): SetNotificationSettingsReq;
  clearPreferencesList(): SetNotificationSettingsReq;
  addPreferences(value?: SingleNotificationPreference, index?: number): SingleNotificationPreference;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetNotificationSettingsReq.AsObject;
  static toObject(includeInstance: boolean, msg: SetNotificationSettingsReq): SetNotificationSettingsReq.AsObject;
  static serializeBinaryToWriter(message: SetNotificationSettingsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetNotificationSettingsReq;
  static deserializeBinaryFromReader(message: SetNotificationSettingsReq, reader: jspb.BinaryReader): SetNotificationSettingsReq;
}

export namespace SetNotificationSettingsReq {
  export type AsObject = {
    enableDoNotEmail: boolean,
    preferencesList: Array<SingleNotificationPreference.AsObject>,
  }
}

export class Notification extends jspb.Message {
  getNotificationId(): number;
  setNotificationId(value: number): Notification;

  getCreated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setCreated(value?: google_protobuf_timestamp_pb.Timestamp): Notification;
  hasCreated(): boolean;
  clearCreated(): Notification;

  getTopic(): string;
  setTopic(value: string): Notification;

  getAction(): string;
  setAction(value: string): Notification;

  getKey(): string;
  setKey(value: string): Notification;

  getTitle(): string;
  setTitle(value: string): Notification;

  getBody(): string;
  setBody(value: string): Notification;

  getIcon(): string;
  setIcon(value: string): Notification;

  getUrl(): string;
  setUrl(value: string): Notification;

  getIsSeen(): boolean;
  setIsSeen(value: boolean): Notification;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Notification.AsObject;
  static toObject(includeInstance: boolean, msg: Notification): Notification.AsObject;
  static serializeBinaryToWriter(message: Notification, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Notification;
  static deserializeBinaryFromReader(message: Notification, reader: jspb.BinaryReader): Notification;
}

export namespace Notification {
  export type AsObject = {
    notificationId: number,
    created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    topic: string,
    action: string,
    key: string,
    title: string,
    body: string,
    icon: string,
    url: string,
    isSeen: boolean,
  }
}

export class ListNotificationsReq extends jspb.Message {
  getOnlyUnread(): boolean;
  setOnlyUnread(value: boolean): ListNotificationsReq;

  getPageSize(): number;
  setPageSize(value: number): ListNotificationsReq;

  getPageToken(): string;
  setPageToken(value: string): ListNotificationsReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListNotificationsReq.AsObject;
  static toObject(includeInstance: boolean, msg: ListNotificationsReq): ListNotificationsReq.AsObject;
  static serializeBinaryToWriter(message: ListNotificationsReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListNotificationsReq;
  static deserializeBinaryFromReader(message: ListNotificationsReq, reader: jspb.BinaryReader): ListNotificationsReq;
}

export namespace ListNotificationsReq {
  export type AsObject = {
    onlyUnread: boolean,
    pageSize: number,
    pageToken: string,
  }
}

export class ListNotificationsRes extends jspb.Message {
  getNotificationsList(): Array<Notification>;
  setNotificationsList(value: Array<Notification>): ListNotificationsRes;
  clearNotificationsList(): ListNotificationsRes;
  addNotifications(value?: Notification, index?: number): Notification;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListNotificationsRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListNotificationsRes.AsObject;
  static toObject(includeInstance: boolean, msg: ListNotificationsRes): ListNotificationsRes.AsObject;
  static serializeBinaryToWriter(message: ListNotificationsRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListNotificationsRes;
  static deserializeBinaryFromReader(message: ListNotificationsRes, reader: jspb.BinaryReader): ListNotificationsRes;
}

export namespace ListNotificationsRes {
  export type AsObject = {
    notificationsList: Array<Notification.AsObject>,
    nextPageToken: string,
  }
}

export class MarkNotificationSeenReq extends jspb.Message {
  getNotificationId(): number;
  setNotificationId(value: number): MarkNotificationSeenReq;

  getSetSeen(): boolean;
  setSetSeen(value: boolean): MarkNotificationSeenReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkNotificationSeenReq.AsObject;
  static toObject(includeInstance: boolean, msg: MarkNotificationSeenReq): MarkNotificationSeenReq.AsObject;
  static serializeBinaryToWriter(message: MarkNotificationSeenReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkNotificationSeenReq;
  static deserializeBinaryFromReader(message: MarkNotificationSeenReq, reader: jspb.BinaryReader): MarkNotificationSeenReq;
}

export namespace MarkNotificationSeenReq {
  export type AsObject = {
    notificationId: number,
    setSeen: boolean,
  }
}

export class MarkAllNotificationsSeenReq extends jspb.Message {
  getLatestNotificationId(): number;
  setLatestNotificationId(value: number): MarkAllNotificationsSeenReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkAllNotificationsSeenReq.AsObject;
  static toObject(includeInstance: boolean, msg: MarkAllNotificationsSeenReq): MarkAllNotificationsSeenReq.AsObject;
  static serializeBinaryToWriter(message: MarkAllNotificationsSeenReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkAllNotificationsSeenReq;
  static deserializeBinaryFromReader(message: MarkAllNotificationsSeenReq, reader: jspb.BinaryReader): MarkAllNotificationsSeenReq;
}

export namespace MarkAllNotificationsSeenReq {
  export type AsObject = {
    latestNotificationId: number,
  }
}

export class GetVapidPublicKeyRes extends jspb.Message {
  getVapidPublicKey(): string;
  setVapidPublicKey(value: string): GetVapidPublicKeyRes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetVapidPublicKeyRes.AsObject;
  static toObject(includeInstance: boolean, msg: GetVapidPublicKeyRes): GetVapidPublicKeyRes.AsObject;
  static serializeBinaryToWriter(message: GetVapidPublicKeyRes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetVapidPublicKeyRes;
  static deserializeBinaryFromReader(message: GetVapidPublicKeyRes, reader: jspb.BinaryReader): GetVapidPublicKeyRes;
}

export namespace GetVapidPublicKeyRes {
  export type AsObject = {
    vapidPublicKey: string,
  }
}

export class RegisterPushNotificationSubscriptionReq extends jspb.Message {
  getFullSubscriptionJson(): string;
  setFullSubscriptionJson(value: string): RegisterPushNotificationSubscriptionReq;

  getUserAgent(): string;
  setUserAgent(value: string): RegisterPushNotificationSubscriptionReq;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterPushNotificationSubscriptionReq.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterPushNotificationSubscriptionReq): RegisterPushNotificationSubscriptionReq.AsObject;
  static serializeBinaryToWriter(message: RegisterPushNotificationSubscriptionReq, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterPushNotificationSubscriptionReq;
  static deserializeBinaryFromReader(message: RegisterPushNotificationSubscriptionReq, reader: jspb.BinaryReader): RegisterPushNotificationSubscriptionReq;
}

export namespace RegisterPushNotificationSubscriptionReq {
  export type AsObject = {
    fullSubscriptionJson: string,
    userAgent: string,
  }
}

