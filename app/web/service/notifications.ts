import {
  GetNotificationSettingsReq,
  SetNotificationSettingsReq,
} from "proto/notifications_pb";
import client from "service/client";

export async function getNotificationSettings() {
  const res = await client.notifications.getNotificationSettings(
    new GetNotificationSettingsReq()
  );
  return res.toObject();
}

export async function setNotificationSettings(enableNewNotifications: boolean) {
  const req = new SetNotificationSettingsReq();
  req.setEnableNewNotifications(enableNewNotifications);
  const res = await client.notifications.setNotificationSettings(req);
  return res.toObject();
}
