import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {
  GetNotificationSettingsReq,
  RegisterPushNotificationSubscriptionReq,
  SetNotificationSettingsReq,
  SingleNotificationPreference,
} from "proto/notifications_pb";

import client from "./client";

export interface NotificationPreferenceData {
  topic: string;
  action: string;
  deliveryMethod: "push" | "email";
  enabled: boolean;
}

export async function getNotificationSettings() {
  const res = await client.notifications.getNotificationSettings(
    new GetNotificationSettingsReq()
  );
  return res.toObject();
}

export async function setNotificationSettings(enableDoNotEmail: boolean) {
  const req = new SetNotificationSettingsReq();
  req.setEnableDoNotEmail(enableDoNotEmail);
  const res = await client.notifications.setNotificationSettings(req);
  return res.toObject();
}

export async function setNotificationSettingsPreference(
  preferenceData: NotificationPreferenceData
) {
  const req = new SetNotificationSettingsReq();
  const preference = new SingleNotificationPreference();
  preference.setTopic(preferenceData.topic);
  preference.setAction(preferenceData.action);
  preference.setDeliveryMethod(preferenceData.deliveryMethod);
  preference.setEnabled(preferenceData.enabled);
  req.setPreferencesList([preference]);

  const res = await client.notifications.setNotificationSettings(req);

  return res.toObject();
}

export async function getVapidPublicKey() {
  const res = await client.notifications.getVapidPublicKey(new Empty());
  return res.toObject();
}

export async function registerPushNotificationSubscription(
  subscription: PushSubscription
) {
  const req = new RegisterPushNotificationSubscriptionReq();
  req.setFullSubscriptionJson(JSON.stringify(subscription));
  req.setUserAgent(navigator.userAgent);
  const res = await client.notifications.registerPushNotificationSubscription(
    req
  );

  return res.toObject();
}

export async function sendTestPushNotification() {
  await client.notifications.sendTestPushNotification(new Empty());
}
