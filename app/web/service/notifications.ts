import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import {
  GetNotificationSettingsReq,
  ListNotificationsReq,
  MarkAllNotificationsSeenReq,
  MarkNotificationSeenReq,
  Notification,
  RegisterPushNotificationSubscriptionReq,
  SetNotificationSettingsReq,
  SingleNotificationPreference,
} from "@/proto/notifications_pb";

import client from "./client";

export interface NotificationPreferenceData {
  topic: string;
  action: string;
  deliveryMethod: "push" | "email";
  enabled: boolean;
}

export const getNotificationSettings = async () => {
  const res = await client.notifications.getNotificationSettings(
    new GetNotificationSettingsReq(),
  );
  return res.toObject();
};

export const setNotificationSettings = async (enableDoNotEmail: boolean) => {
  const req = new SetNotificationSettingsReq();
  req.setEnableDoNotEmail(enableDoNotEmail);
  const res = await client.notifications.setNotificationSettings(req);
  return res.toObject();
};

export const setNotificationSettingsPreference = async (
  preferenceData: NotificationPreferenceData,
) => {
  const req = new SetNotificationSettingsReq();
  const preference = new SingleNotificationPreference();
  preference.setTopic(preferenceData.topic);
  preference.setAction(preferenceData.action);
  preference.setDeliveryMethod(preferenceData.deliveryMethod);
  preference.setEnabled(preferenceData.enabled);
  req.setPreferencesList([preference]);

  const res = await client.notifications.setNotificationSettings(req);

  return res.toObject();
};

export const getVapidPublicKey = async () => {
  const res = await client.notifications.getVapidPublicKey(new Empty());
  return res.toObject();
};

export const registerPushNotificationSubscription = async (
  subscription: PushSubscription,
) => {
  const req = new RegisterPushNotificationSubscriptionReq();
  req.setFullSubscriptionJson(JSON.stringify(subscription));
  req.setUserAgent(navigator.userAgent);
  const res =
    await client.notifications.registerPushNotificationSubscription(req);

  return res.toObject();
};

export const sendTestPushNotification = async () => {
  await client.notifications.sendTestPushNotification(new Empty());
};

export const listNotifications = async ({
  onlyUnread = false,
}: {
  onlyUnread: boolean;
}) => {
  const req = new ListNotificationsReq();

  if (onlyUnread) {
    req.setOnlyUnread(true);
  }

  const res = await client.notifications.listNotifications(req);
  return res.toObject();
};

export const markAllNotificationsSeen = async (
  lastestNotificationId: Notification.AsObject["notificationId"],
) => {
  const req = new MarkAllNotificationsSeenReq();

  req.setLatestNotificationId(lastestNotificationId);

  const res = await client.notifications.markAllNotificationsSeen(req);
  return res.toObject();
};

export const markNotificationSeen = async (
  notificationId: Notification.AsObject["notificationId"],
  setSeen: boolean = true,
) => {
  const req = new MarkNotificationSeenReq();

  if (!notificationId) {
    throw new Error(
      "Notification ID is required to mark notification as seen.",
    );
  }

  if (setSeen) {
    req.setSetSeen(setSeen);
  }

  req.setNotificationId(notificationId);

  const res = await client.notifications.markNotificationSeen(req);
  return res.toObject();
};
