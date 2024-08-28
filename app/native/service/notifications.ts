import {
  GetNotificationSettingsReq,
  SetNotificationSettingsReq,
} from "proto/notifications_pb";

import client from "./client";

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
