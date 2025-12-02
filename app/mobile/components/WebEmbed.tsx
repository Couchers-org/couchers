import { useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

import { useAuthContext } from "@/features/auth/AuthContext";
import { theme } from "@/theme";

type WebEmbedProps = {
  path: string;
};

export default function WebEmbed({ path }: WebEmbedProps) {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const webviewRef = useRef<WebView>(null);
  const router = useRouter();
  const { markLoggedOut, setUserId, setJailed, markAuthenticated } =
    useAuthContext();

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

    // Prevent navigation to external sites
    if (!normalizedUrl.startsWith(WEB_BASE_URL)) {
      webviewRef.current?.stopLoading();
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload?.type === "LOGIN_SUCCESS") {
        // Web app says user logged in - update mobile state
        setUserId(payload.userId);
        setJailed(payload.jailed || false);
        markAuthenticated();
      } else if (payload?.type === "LOGOUT") {
        // Web app says user logged out - clear mobile state and navigate to login
        markLoggedOut();
        router.replace("/login");
      }
    } catch (error) {
      // Silently ignore non-JSON messages (expected from browser/WebView internals)
      // These are typically not errors - just messages from the WebView itself
      if (__DEV__) {
        console.debug("WebEmbed: Ignoring non-JSON message", error);
      }
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
        onError={(syntheticEvent) => {
          if (__DEV__) {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView error:", nativeEvent);
            console.error("URL:", WEB_BASE_URL + path);
          }
        }}
        onHttpError={(syntheticEvent) => {
          if (__DEV__) {
            const { nativeEvent } = syntheticEvent;
            console.error(
              "WebView HTTP error:",
              nativeEvent.statusCode,
              nativeEvent.url,
            );
          }
        }}
        renderError={(errorDomain, errorCode, errorDesc) => {
          if (__DEV__) {
            console.error(
              "WebView render error:",
              errorDomain,
              errorCode,
              errorDesc,
            );
          }
          return (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load page</Text>
            </View>
          );
        }}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    color: "#666",
    fontSize: 16,
  },
});
