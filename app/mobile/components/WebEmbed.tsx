import { StyleSheet, View, useColorScheme } from "react-native";
import { useRef } from "react";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { theme } from "@/theme";

type WebEmbedProps = {
  path: string;
};

// @TODO(NA): Handle browser push notifications in web app so doesn't throw error
// @TODO(NA): Get bottom nav only showing when logged in

// Injected JavaScript to capture errors from the web app
const injectedJavaScript = `
  (function() {
    // Capture uncaught errors
    window.addEventListener('error', function(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'WEB_ERROR',
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }));
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'WEB_ERROR',
        message: 'Unhandled Promise Rejection: ' + event.reason,
        stack: event.reason?.stack,
      }));
    });

    // Capture console errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'WEB_CONSOLE_ERROR',
        message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
      }));
      originalConsoleError.apply(console, args);
    };
  })();
  true; // Required to prevent issues on iOS
`;

export default function WebEmbed({ path }: WebEmbedProps) {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const webviewRef = useRef<WebView>(null);
  const router = useRouter();

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

      if (payload?.type === "LOGIN") {
        // Web app says user logged in - navigate to dashboard
        console.log("User logged in - navigating to dashboard");
        router.replace("/(tabs)/dashboard");
      } else if (payload?.type === "LOGOUT") {
        // Web app says user logged out - navigate to login
        console.log("User logged out - navigating to login");
        router.replace("/login");
      } else if (payload?.type === "WEB_ERROR") {
        console.error("=== WEB APP ERROR ===");
        console.error("Message:", payload.message);
        if (payload.stack) {
          console.error("Stack:", payload.stack);
        }
        if (payload.filename) {
          console.error(
            `Location: ${payload.filename}:${payload.lineno}:${payload.colno}`
          );
        }
        console.error("===================");
      } else if (payload?.type === "WEB_CONSOLE_ERROR") {
        console.error("=== WEB APP CONSOLE ERROR ===");
        console.error(payload.message);
        console.error("============================");
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
        injectedJavaScript={injectedJavaScript}
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
