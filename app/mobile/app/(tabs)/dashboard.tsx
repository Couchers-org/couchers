import { useLocalSearchParams } from "expo-router";

import WebEmbed from "@/components/WebEmbed";
import { buildWebEmbedPath } from "@/utils/buildWebEmbedPath";

// UNCOMMENT BELOW TO ENABLE DEBUG BUTTON
// import { View, TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
// import client from "@/service/client";
// import { SendDevPushNotificationReq } from "@/proto/notifications_pb";

export default function DashboardScreen() {
  const params = useLocalSearchParams();
  const path = buildWebEmbedPath("/dashboard", params);

  // UNCOMMENT BELOW TO ENABLE DEBUG BUTTON
  // const handleTestNotification = async () => {
  //   try {
  //     const req = new SendDevPushNotificationReq();
  //     req.setTitle("Write your reference for Test User");
  //     req.setBody("You still have 7 days to write a reference for Test User.");
  //     // Use your local BASE_URL - adjust user_id and host_request_id as needed
  //     req.setUrl("http://192.168.110.150:3000/leave-reference/hosted/10/4");
  //     await client.notifications.sendDevPushNotification(req);
  //     Alert.alert("Success", "Test notification sent!");
  //   } catch (error) {
  //     console.error("Failed to send test notification:", error);
  //     Alert.alert("Error", `Failed to send notification: ${error}`);
  //   }
  // };

  return <WebEmbed path={path} />;

  // UNCOMMENT BELOW TO ENABLE DEBUG BUTTON (and comment out the line above)
  // return (
  //   <View style={styles.container}>
  //     <WebEmbed path={path} />
  //     <TouchableOpacity
  //       style={styles.debugButton}
  //       onPress={handleTestNotification}
  //     >
  //       <Text style={styles.debugButtonText}>
  //         🔔 Test Leave Reference Notif
  //       </Text>
  //     </TouchableOpacity>
  //   </View>
  // );
}

// UNCOMMENT BELOW TO ENABLE DEBUG BUTTON
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
