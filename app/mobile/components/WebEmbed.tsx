import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

import { useAuthContext } from "@/features/auth/AuthContext";
import errorGraphic from "@/resources/404graphic.png";
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
  const [hasError, setHasError] = useState(false);

  // Track the current WebView URL to detect when it drifts from the expected path
  const currentWebPathRef = useRef<string>(path);

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const handleRetry = () => {
    setHasError(false);
    webviewRef.current?.reload();
  };

  // When this screen gains focus, ensure WebView shows the correct path
  useFocusEffect(
    useCallback(() => {
      const expectedPath = path.split("?")[0];
      const currentPath = currentWebPathRef.current.split("?")[0];

      // If WebView drifted to a different path, navigate it back
      if (currentPath !== expectedPath) {
        const targetUrl = WEB_BASE_URL + path;
        webviewRef.current?.injectJavaScript(
          `window.location.href = "${targetUrl}"; true;`,
        );
        currentWebPathRef.current = path;
      }
    }, [path, WEB_BASE_URL]),
  );

  // Map web paths to tab names
  const getTabNameForPath = (webPath: string): string | null => {
    if (webPath.startsWith("/dashboard")) return "dashboard";
    if (webPath.startsWith("/messages")) return "messages";
    if (webPath.startsWith("/search")) return "search";
    if (webPath.startsWith("/communities")) return "communities";
    return null;
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url, loading } = navState;

    if (!url || loading) {
      return;
    }

    const normalizedUrl = url.split("#")[0];

    // Prevent navigation to external sites
    if (!normalizedUrl.startsWith(WEB_BASE_URL)) {
      webviewRef.current?.stopLoading();
      return;
    }

    // Track the current web path
    const webPath: string = normalizedUrl.replace(WEB_BASE_URL, "") || "/";
    currentWebPathRef.current = webPath;

    // Sync native tab highlighting when WebView navigates to a different section
    const targetTab = getTabNameForPath(webPath);
    const currentTab = getTabNameForPath(path);

    if (targetTab !== currentTab) {
      if (targetTab) {
        // Navigate to a main tab
        router.navigate(`/${targetTab}`);
      } else {
        // Navigate to non-tab route (deselects all tabs)
        router.navigate(webPath as `/${string}`);
      }
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

  // Show error screen
  if (hasError) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={{ height: insets.top, backgroundColor }} />
        <View style={styles.errorContainer}>
          <Image source={errorGraphic} style={styles.errorImage} />
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorText}>
            Check your internet connection and try again.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={{ height: insets.top, backgroundColor }} />
      <WebView
        ref={webviewRef}
        style={styles.webview}
        source={{ uri: WEB_BASE_URL + path }}
        sharedCookiesEnabled
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.palette.primary.main}
            />
          </View>
        )}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScriptObject={{ isCouchersNativeEmbed: true }}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          setHasError(true);
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
          setHasError(true);
          if (__DEV__) {
            console.error(
              "WebView render error:",
              errorDomain,
              errorCode,
              errorDesc,
            );
          }
          return <View />; // We handle this with hasError state
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
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorImage: {
    width: "70%",
    height: 200,
    resizeMode: "contain",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.palette.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
