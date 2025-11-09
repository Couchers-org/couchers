import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";

import { useAuthContext } from "@/features/auth/AuthContext";
import { loginRoute } from "@/routes";
import { theme } from "@/theme";

export default function LoginScreen() {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;
  const { markAuthenticated, setUserId, setJailed } = useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "LOGIN_SUCCESS") {
        // Update mobile auth state from web login
        setUserId(data.userId);
        setJailed(data.jailed || false);
        markAuthenticated();

        // TODO(NA): Later, offer FaceID enrollment here
        // if (data.userId) {
        //   await offerFaceIDEnrollment(username, password);
        // }

        // Navigate to dashboard with native tabs
        router.replace("/(tabs)/dashboard");
      }
    } catch (error) {
      // Silently ignore non-JSON messages (expected from browser/WebView internals)
      if (__DEV__) {
        console.debug("LoginScreen: Ignoring non-JSON message", error);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <WebView
        source={{ uri: WEB_BASE_URL + loginRoute }}
        sharedCookiesEnabled
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
}
