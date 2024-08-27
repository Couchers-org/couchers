import {
  GetNotificationSettingsReq,
  NotificationItem,
  SetNotificationSettingsReq,
  SingleNotificationPreference,
} from "proto/notifications_pb";
import client from "service/client";

export interface NotificationPreferenceData {
  topic: string,
  action: string,
  deliveryMethod: 'push' | 'email',
  enabled: boolean,
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

export async function setNotificationSettingsPreference(preferenceData: NotificationPreferenceData) {
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
