import * as Notifications from "expo-notifications";
import { useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

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
