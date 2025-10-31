import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { router } from "expo-router";

export default function Login() {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;
  const { authActions } = useAuthContext();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <WebView
        style={{ flex: 1 }}
        source={{ uri: WEB_BASE_URL + "/login" }}
        sharedCookiesEnabled
        onNavigationStateChange={async (s) => {
          if (s.url.startsWith(WEB_BASE_URL + "/dashboard")) {
            // Update auth state and navigate to dashboard tab
            await authActions.checkAuthStatus();
            router.replace("/(tabs)/dashboard");
          }
        }}
      />
    </SafeAreaView>
  );
}
