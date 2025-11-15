import { RegisterMobilePushNotificationSubscriptionReq } from "@/proto/notifications_pb";

import client from "./client";

export async function registerMobilePushNotificationSubscription({
  token,
  platform,
  deviceName,
  deviceType,
}: {
  token: string;
  platform: string;
  deviceName?: string;
  deviceType?: string;
}) {
  const req = new RegisterMobilePushNotificationSubscriptionReq();
  req.setToken(token);
  req.setPlatform(platform);
  if (deviceName) req.setDeviceName(deviceName);
  if (deviceType) req.setDeviceType(deviceType);
  await client.notifications.registerMobilePushNotificationSubscription(req);
}
