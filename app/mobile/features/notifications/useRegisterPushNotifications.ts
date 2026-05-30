import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { useAuthContext } from "@/features/auth/AuthContext";
import { setStoredPushToken } from "@/features/diagnostics/pushTokenStore";
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
    console.warn("❌ Push notifications require a physical device");
    return null;
  }

  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    console.warn("❌ Push notification permission not granted");
    return null;
  }

  await configureAndroidChannel();

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    console.error("❌ Missing Expo project ID for push notifications");
    console.log("Debug - Constants.expoConfig:", Constants.expoConfig);
    console.log("Debug - Constants.easConfig:", Constants.easConfig);
    console.log(
      "Debug - EXPO_PUBLIC_EAS_PROJECT_ID:",
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    );
    return null;
  }

  try {
    console.log("🔔 Requesting Expo push token with projectId:", projectId);
    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    console.log("✅ Successfully obtained Expo push token:", tokenResult.data);
    return tokenResult.data;
  } catch (error) {
    console.error("❌ Failed to get Expo push token:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return null;
  }
}

async function getDeviceName(): Promise<string | undefined> {
  if (Device.deviceName) {
    return Device.deviceName;
  }
  return undefined;
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
      try {
        console.log("🔔 Starting push notification registration...");
        const token = await getExpoPushToken();
        if (!token || cancelled) {
          console.log("❌ No token or cancelled", { token, cancelled });
          return;
        }

        if (lastRegisteredTokenRef.current === token) {
          console.log("✅ Token already registered, skipping");
          return;
        }

        const deviceName = await getDeviceName();
        console.log("📱 Device info:", { deviceName, deviceType: Platform.OS });

        console.log("📤 Registering token with backend...");
        await registerMobilePushNotificationSubscription({
          token,
          deviceName,
          deviceType: Platform.OS,
        });

        lastRegisteredTokenRef.current = token;
        await setStoredPushToken(token);
        console.log("✅ Push notification registration complete");
      } catch (error) {
        console.error(
          "❌ Failed to register push notification subscription:",
          error,
        );
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        }
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [authenticated, userId]);
}
