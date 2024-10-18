import { Platform, StatusBar, View } from "react-native";
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserPage from "@/features/profile/view/UserPage";
import { userTabs } from "@/routes";

export default function User() {
  const { username, tab } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  let parsedTab = undefined;
  if (tab) {
    parsedTab = userTabs.find((valid) => tab === valid);
    if (!parsedTab) return router.push('/not-found' as any); // TODO: Redirect to 404 page for now
  }

  return (
    <View
      style={{
        flex: 1,
        paddingTop:
          Platform.OS === "android" ? StatusBar.currentHeight : insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <UserPage username={username as string} tab={parsedTab} />
    </View>
  );
}
