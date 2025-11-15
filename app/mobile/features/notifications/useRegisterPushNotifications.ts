import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { useAuthContext } from "@/features/auth/AuthContext";
import { registerMobilePushNotificationSubscription } from "@/service/notifications";

async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function configureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#ffffff",
  });
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    console.warn("Push notification permission not granted");
    return null;
  }

  await configureAndroidChannel();

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    console.warn("Missing Expo project ID for push notifications");
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResult.data;
}

async function getDeviceName(): Promise<string | undefined> {
  if (Device.deviceName) {
    return Device.deviceName;
  }
  try {
    return await Device.getDeviceNameAsync();
  } catch {
    return undefined;
  }
}

export function useRegisterPushNotifications() {
  const { authenticated, userId } = useAuthContext();
  const lastRegisteredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authenticated || !userId) {
      return;
    }

    let cancelled = false;

    async function register() {
      const token = await getExpoPushToken();
      if (!token || cancelled) {
        return;
      }

      if (lastRegisteredTokenRef.current === token) {
        return;
      }

      const deviceName = await getDeviceName();
      await registerMobilePushNotificationSubscription({
        token,
        platform: "expo",
        deviceName,
        deviceType: Platform.OS,
      });

      lastRegisteredTokenRef.current = token;
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [authenticated, userId]);
}
