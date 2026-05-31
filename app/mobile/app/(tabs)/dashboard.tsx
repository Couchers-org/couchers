import * as Notifications from "expo-notifications";
import { useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

// Set notification handler to show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Set up notification channel for Android
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    sound: null,
  });
}

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const path = buildWebEmbedPath("/dashboard", params);

  return <WebEmbed path={path} />;
}
