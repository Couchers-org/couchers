import {
  RegisterMobilePushNotificationSubscriptionReq,
  SetBaseUrlOverrideReq,
} from "@/proto/notifications_pb";

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

// Dev/preview only (server-gated by ENABLE_DEV_APIS): point backend-generated links at the given base URL.
export async function setBaseUrlOverride(baseUrl: string) {
  const req = new SetBaseUrlOverrideReq();
  req.setBaseUrl(baseUrl);
  await client.notifications.setBaseUrlOverride(req);
}
