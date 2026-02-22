import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Appearance,
  BackHandler,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import { useAuthContext } from "@/features/auth/AuthContext";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useWebNavigation } from "@/hooks/useWebNavigation";
import errorGraphic from "@/resources/404graphic.png";
import { theme } from "@/theme";
import { shouldLoadInWebView } from "@/utils/webViewUrlUtils";

type WebEmbedProps = {
  path: string;
};

export default function WebEmbed({ path }: WebEmbedProps) {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const webviewRef = useRef<WebView>(null);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { markLoggedOut, setUserId, setJailed, markAuthenticated } =
    useAuthContext();
  const [hasError, setHasError] = useState(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2; // Auto-retry up to 2 times for timeout errors

  // Track the target path we're syncing to (to ignore navigation during sync)
  const syncTargetPathRef = useRef<string | null>(null);

  // Custom hooks for image picking and navigation
  const { pickImage } = useImagePicker();
  const { handleNavigationStateChange, canGoBackRef, currentWebPathRef } =
    useWebNavigation({
      webBaseUrl: WEB_BASE_URL,
      currentPath: path,
      syncTargetPathRef,
      onRetryCountReset: () => {
        retryCountRef.current = 0;
      },
    });

  // Handle Android hardware back button - go back in WebView if possible
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return;
      }

      const onBackPress = () => {
        if (canGoBackRef.current && webviewRef.current) {
          webviewRef.current.goBack();
          return true; // Prevent default back behavior
        }
        return false; // Let native navigation handle it
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [canGoBackRef]),
  );

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const handleRetry = () => {
    setHasError(false);
    webviewRef.current?.reload();
  };

  // Helper to strip locale prefix from path
  const stripLocale = useCallback(
    (p: string) => p.replace(/^\/[a-z]{2}(-[A-Z][a-z]+)?\//, "/"),
    [],
  );

  // Sync WebView when path prop changes (route navigation)
  useEffect(() => {
    // If there's already a sync in progress, skip this one to avoid conflicts
    if (syncTargetPathRef.current !== null) {
      return;
    }

    // Read the current WebView path from the ref (always up-to-date)
    const currentWebPath = currentWebPathRef.current;

    // Strip locales from both paths for comparison
    const currentRoute = stripLocale(currentWebPath);
    const targetRoute = stripLocale(path);

    if (currentRoute === targetRoute) {
      // Same route, just different locale or already synced
      return;
    }

    // Routes differ - sync WebView, using mobile i18n language as source of truth
    // This ensures language selection persists across tab switches
    const currentLocale = i18n.language !== "en" ? i18n.language : null;
    const targetPath = currentLocale
      ? `/${currentLocale}${targetRoute}`
      : targetRoute;

    syncTargetPathRef.current = targetPath;
    // Use postMessage to trigger client-side Next.js navigation
    // This avoids middleware redirects based on stale cookies
    webviewRef.current?.injectJavaScript(`
      window.postMessage(${JSON.stringify({ type: "MOBILE_NAVIGATE", path: targetPath })}, "*");
      true;
    `);
  }, [path, WEB_BASE_URL, stripLocale, i18n.language, currentWebPathRef]);

  // Sync WebView when screen comes back into focus (tab switch)
  useFocusEffect(
    useCallback(() => {
      // If there's already a sync in progress, skip this one to avoid conflicts
      if (syncTargetPathRef.current !== null) {
        return;
      }

      // Read the current WebView path from the ref (always up-to-date)
      const currentWebPath = currentWebPathRef.current;

      // Strip locales from both paths for comparison
      const currentRoute = stripLocale(currentWebPath);
      const targetRoute = stripLocale(path);

      if (currentRoute === targetRoute) {
        // Same route, just different locale or already synced
        return;
      }

      // Routes differ - sync WebView, using mobile i18n language as source of truth
      // This ensures language selection persists across tab switches
      const currentLocale = i18n.language !== "en" ? i18n.language : null;
      const targetPath = currentLocale
        ? `/${currentLocale}${targetRoute}`
        : targetRoute;

      syncTargetPathRef.current = targetPath;
      // Use postMessage to trigger client-side Next.js navigation
      // This avoids middleware redirects based on stale cookies
      webviewRef.current?.injectJavaScript(`
        window.postMessage(${JSON.stringify({ type: "MOBILE_NAVIGATE", path: targetPath })}, "*");
        true;
      `);
    }, [path, stripLocale, i18n.language, currentWebPathRef]),
  );

  // Send result back to web app
  const sendImagePickResult = (result: {
    success: boolean;
    imageBase64?: string;
    mimeType?: string;
    canceled?: boolean;
    error?: string;
  }) => {
    webviewRef.current?.injectJavaScript(`
      window.postMessage(${JSON.stringify({ type: "IMAGE_PICK_RESULT", result })}, "*");
      true;
    `);
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
        router.replace("/login" as Href);
      } else if (payload?.type === "COLOR_SCHEME_CHANGE") {
        // Web app toggled dark mode - sync native UI using React Native's built-in API
        // mode can be "light", "dark", or null (follow system)
        // Web app toggled dark mode - sync native UI
        const mode = payload.mode;
        if (mode === "light" || mode === "dark" || mode === null) {
          Appearance.setColorScheme(mode);
        }
      } else if (payload?.type === "REQUEST_IMAGE_PICK") {
        // Web app requests native image picker (WebView file input crashes on mobile)
        pickImage(sendImagePickResult);
      }
    } catch (error) {
      // Silently ignore non-JSON messages (expected from browser/WebView internals)
      // These are typically not errors - just messages from the WebView itself
      if (__DEV__) {
        console.debug("WebEmbed: Ignoring non-JSON message", error);
      }
    }
  };

  // Intercept URL requests before they load
  const handleShouldStartLoad = (event: { url: string }): boolean => {
    const { url } = event;

    if (shouldLoadInWebView(url, WEB_BASE_URL)) {
      return true;
    }

    // External HTTP/HTTPS URLs (Stripe, etc.): open in device's browser
    Linking.openURL(url).catch((err) => {
      if (__DEV__) {
        console.error("Failed to open external URL:", err);
      }
    });
    return false;
  };

  const handleOpenWindow = (syntheticEvent: {
    nativeEvent: { targetUrl: string };
  }) => {
    const { targetUrl } = syntheticEvent.nativeEvent;

    // Check if link is internal (within our app)
    if (targetUrl.startsWith(WEB_BASE_URL)) {
      // Internal link: navigate within WebView instead of opening externally
      webviewRef.current?.injectJavaScript(
        `window.location.href = "${targetUrl}"; true;`,
      );
    } else {
      // External link: open in device's browser (Safari/Chrome)
      Linking.openURL(targetUrl).catch((err) => {
        if (__DEV__) {
          console.error("Failed to open external link:", err);
        }
      });
    }
  };

  // Show error screen
  if (hasError) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={{ height: insets.top, backgroundColor }} />
        <View style={styles.errorContainer}>
          <Image source={errorGraphic} style={styles.errorImage} />
          <Text style={styles.errorTitle}>{t("errors.failed_to_load")}</Text>
          <Text style={styles.errorText}>{t("errors.check_connection")}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("errors.try_again")}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>{t("errors.try_again")}</Text>
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
        style={[styles.webview, { backgroundColor }]}
        source={{ uri: WEB_BASE_URL + path }}
        allowsBackForwardNavigationGestures // iOS swipe back/forward
        sharedCookiesEnabled
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        startInLoadingState
        javaScriptEnabled={true}
        domStorageEnabled={true}
        renderLoading={() => (
          <View style={[styles.loadingContainer, { backgroundColor }]}>
            <ActivityIndicator
              size="large"
              color={theme.palette.primary.main}
            />
          </View>
        )}
        injectedJavaScriptObject={{ isNativeEmbed: true }}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onOpenWindow={handleOpenWindow}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          const isTimeout = nativeEvent.code === -1001;

          // Auto-retry on timeout (server might be cold/slow)
          if (isTimeout && retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            if (__DEV__) {
              console.log(
                `Timeout, retrying (${retryCountRef.current}/${MAX_RETRIES})...`,
              );
            }
            webviewRef.current?.reload();
            return;
          }

          setHasError(true);
          if (__DEV__) {
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
          return <View />;
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
