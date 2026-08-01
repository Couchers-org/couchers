import { RegisterMobilePushNotificationSubscriptionReq } from "couchers/proto/notifications_pb";

import client from "./client";

export async function registerMobilePushNotificationSubscription({
  token,
  deviceName,
  deviceType,
}: {
  token: string;
  deviceName?: string;
  deviceType?: string;
}) {
  const req = new RegisterMobilePushNotificationSubscriptionReq();
  req.setToken(token);
  if (deviceName) req.setDeviceName(deviceName);
  if (deviceType) req.setDeviceType(deviceType);
  await client.notifications.registerMobilePushNotificationSubscription(req);
}
