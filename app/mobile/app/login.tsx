import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function Login() {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <WebView
        style={{ flex: 1 }}
        source={{ uri: WEB_BASE_URL + "/login" }}
        sharedCookiesEnabled
      />
    </SafeAreaView>
  );
}
