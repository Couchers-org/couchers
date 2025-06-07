import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as notifications_pb from './notifications_pb'; // proto import: "notifications.proto"


export class NotificationsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getNotificationSettings(
    request: notifications_pb.GetNotificationSettingsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: notifications_pb.GetNotificationSettingsRes) => void
  ): grpcWeb.ClientReadableStream<notifications_pb.GetNotificationSettingsRes>;

  setNotificationSettings(
    request: notifications_pb.SetNotificationSettingsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: notifications_pb.GetNotificationSettingsRes) => void
  ): grpcWeb.ClientReadableStream<notifications_pb.GetNotificationSettingsRes>;

  listNotifications(
    request: notifications_pb.ListNotificationsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: notifications_pb.ListNotificationsRes) => void
  ): grpcWeb.ClientReadableStream<notifications_pb.ListNotificationsRes>;

  markNotificationSeen(
    request: notifications_pb.MarkNotificationSeenReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  markAllNotificationsSeen(
    request: notifications_pb.MarkAllNotificationsSeenReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  getVapidPublicKey(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: notifications_pb.GetVapidPublicKeyRes) => void
  ): grpcWeb.ClientReadableStream<notifications_pb.GetVapidPublicKeyRes>;

  registerPushNotificationSubscription(
    request: notifications_pb.RegisterPushNotificationSubscriptionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  sendTestPushNotification(
    request: google_protobuf_empty_pb.Empty,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

}

export class NotificationsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  getNotificationSettings(
    request: notifications_pb.GetNotificationSettingsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<notifications_pb.GetNotificationSettingsRes>;

  setNotificationSettings(
    request: notifications_pb.SetNotificationSettingsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<notifications_pb.GetNotificationSettingsRes>;

  listNotifications(
    request: notifications_pb.ListNotificationsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<notifications_pb.ListNotificationsRes>;

  markNotificationSeen(
    request: notifications_pb.MarkNotificationSeenReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  markAllNotificationsSeen(
    request: notifications_pb.MarkAllNotificationsSeenReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  getVapidPublicKey(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<notifications_pb.GetVapidPublicKeyRes>;

  registerPushNotificationSubscription(
    request: notifications_pb.RegisterPushNotificationSubscriptionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  sendTestPushNotification(
    request: google_protobuf_empty_pb.Empty,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

}

