import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfilePage from "@/features/profile/view/ProfilePage";
import { Platform, StatusBar, View } from "react-native";

export default function Profile() {
  const insets = useSafeAreaInsets();
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
      <ProfilePage />
    </View>
  );
}
