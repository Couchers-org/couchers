import * as Notifications from "expo-notifications";
import { useLocalSearchParams } from "expo-router";
import { Platform } from "react-native";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

// UNCOMMENT BELOW TO ENABLE DEBUG NOTIFICATION BUTTON
// import {
//   View,
//   TouchableOpacity,
//   Text,
//   StyleSheet,
//   Alert,
// } from "react-native";

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

  // UNCOMMENT BELOW TO ENABLE DEBUG NOTIFICATION BUTTON
  // const handleTestNotification = async () => {
  //   try {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     if (status !== "granted") {
  //       Alert.alert("Permission needed", "Please enable notifications");
  //       return;
  //     }
  //     await Notifications.scheduleNotificationAsync({
  //       content: {
  //         title: "Write your reference for Test User",
  //         body: "You still have 7 days to write a reference for Test User.",
  //         data: { test: true },
  //       },
  //       trigger: {
  //         type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  //         seconds: 1,
  //       },
  //     });
  //     Alert.alert("Success", "Check the status bar in 1 second!");
  //   } catch (error) {
  //     console.error("Failed to send test notification:", error);
  //     Alert.alert("Error", `Failed: ${error}`);
  //   }
  // };
  // return (
  //   <View style={styles.container}>
  //     <WebEmbed path={path} />
  //     <TouchableOpacity
  //       style={styles.debugButton}
  //       onPress={handleTestNotification}
  //     >
  //       <Text style={styles.debugButtonText}>🔔 Test Notification Icon</Text>
  //     </TouchableOpacity>
  //   </View>
  // );
}

// UNCOMMENT BELOW TO ENABLE DEBUG NOTIFICATION BUTTON
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   debugButton: {
//     position: "absolute",
//     bottom: 100,
//     left: 20,
//     right: 20,
//     backgroundColor: "#ff6b6b",
//     padding: 16,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   debugButtonText: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 14,
//   },
// });
