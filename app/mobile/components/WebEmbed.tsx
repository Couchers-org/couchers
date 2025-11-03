import { StyleSheet, View, useColorScheme } from "react-native";
import { useRef } from "react";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/theme";
import { useAuthContext } from "@/features/auth/AuthContext";

type WebEmbedProps = {
  path: string;
};

// @TODO(NA): Handle browser push notifications in web app so doesn't throw error
// @TODO(NA): Get bottom nav only showing when logged in

export default function WebEmbed({ path }: WebEmbedProps) {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const webviewRef = useRef<WebView>(null);
  const { markLoggedOut } = useAuthContext();

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    if (!url) {
      return;
    }

    const normalizedUrl = url.split("#")[0];

    console.log("NORMALIZED URL WEB EMBED", normalizedUrl);

    if (!normalizedUrl.startsWith(WEB_BASE_URL)) {
      webviewRef.current?.stopLoading();
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === "LOGOUT") {
        markLoggedOut();
      }
    } catch (error) {
      // ignore non-JSON messages
      console.log("ERROR HANDLING MESSAGE WEB EMBED", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={{ height: insets.top, backgroundColor }} />
      <WebView
        ref={webviewRef}
        style={styles.webview}
        source={{ uri: WEB_BASE_URL + path }}
        sharedCookiesEnabled
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScriptObject={{ isCouchersNativeEmbed: true }}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
