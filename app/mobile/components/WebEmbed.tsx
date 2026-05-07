import { useFocusEffect } from "expo-router";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Appearance,
  AppState,
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
import client from "@/service/client";
import { dispatchEscapeRef, lastLoginTimeRef } from "@/state/webViewState";
import { theme } from "@/theme";
import { applicationNameForUserAgent } from "@/utils/userAgent";
import { shouldLoadInWebView } from "@/utils/webViewUrlUtils";

type WebEmbedProps = {
  path: string;
};

export default function WebEmbed({ path }: WebEmbedProps) {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;

  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const webviewRef = useRef<WebView>(null);
  const { t, i18n } = useTranslation();
  const { markLoggedOut, setUserId, setJailed, markAuthenticated } =
    useAuthContext();
  const [hasError, setHasError] = useState(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;

  // Tracks the path we're syncing to so handleNavigationStateChange can
  // distinguish sync-triggered navigations from user-initiated ones.
  const syncTargetPathRef = useRef<string | null>(null);

  // True once the WebView completes its first load. Syncs are skipped until
  // then because the source URI already loads the correct URL — sending
  // MOBILE_NAVIGATE before load completes races with user-initiated navigation.
  const hasLoadedRef = useRef(false);

  // Tracks when the app entered the background so we can reload a stale WebView.
  const backgroundTimeRef = useRef<number | null>(null);

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

  const stripLocale = useCallback(
    (p: string) => p.replace(/^\/[a-z]{2}(-[A-Z][a-z]+)?\//, "/"),
    [],
  );

  // Register escape-dispatch callback while this tab is focused so the tab bar
  // can close open menus (e.g. notifications) on any tab press.
  useFocusEffect(
    useCallback(() => {
      dispatchEscapeRef.current = () => {
        webviewRef.current?.injectJavaScript(
          `(document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true })); true;`,
        );
      };
    }, []),
  );

  // Android hardware back button: go back in WebView if possible.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return;
      }

      const onBackPress = () => {
        if (canGoBackRef.current && webviewRef.current) {
          webviewRef.current.goBack();
          return true;
        }
        return false;
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

  // Sync WebView when path prop changes (tab navigation).
  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }
    if (syncTargetPathRef.current !== null) {
      return;
    }

    const targetRoute = stripLocale(path);
    const currentLocale = i18n.language !== "en" ? i18n.language : null;
    const targetPath = currentLocale
      ? `/${currentLocale}${targetRoute}`
      : targetRoute;

    // Skip if already at target — postMessage would be a no-op but setting
    // syncTargetPathRef would leak and block future navigation tracking.
    if (currentWebPathRef.current.split("?")[0] === targetPath) {
      return;
    }

    // [..slug] WebEmbed: don't sync back to the original detail path — the user
    // may have navigated further within the page.
    const tabRoots = [
      "/dashboard",
      "/messages",
      "/search",
      "/communities",
      "/events",
    ];
    if (!tabRoots.includes(stripLocale(path))) {
      return;
    }

    syncTargetPathRef.current = targetPath;
    webviewRef.current?.injectJavaScript(`
      window.postMessage(${JSON.stringify({ type: "MOBILE_NAVIGATE", path: targetPath })}, "*");
      true;
    `);
  }, [path, stripLocale, i18n.language, currentWebPathRef]);

  // Sync WebView when screen comes back into focus (tab switch).
  useFocusEffect(
    useCallback(() => {
      // On blur: close open menus and clear focus.
      const cleanup = () => {
        webviewRef.current?.injectJavaScript(`
          (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
          document.activeElement?.blur();
          true;
        `);
      };

      if (!hasLoadedRef.current) {
        return cleanup;
      }
      if (syncTargetPathRef.current !== null) {
        return cleanup;
      }

      const targetRoute = stripLocale(path);
      const currentLocale = i18n.language !== "en" ? i18n.language : null;
      const targetPath = currentLocale
        ? `/${currentLocale}${targetRoute}`
        : targetRoute;

      // Skip if already at target — same leak-prevention as the useEffect above.
      if (currentWebPathRef.current.split("?")[0] === targetPath) {
        return cleanup;
      }

      // [..slug] WebEmbed: don't sync back to the original detail path.
      const tabRoots = [
        "/dashboard",
        "/messages",
        "/search",
        "/communities",
        "/events",
      ];

      if (!tabRoots.includes(stripLocale(path))) {
        return cleanup;
      }

      syncTargetPathRef.current = targetPath;
      webviewRef.current?.injectJavaScript(`
        window.postMessage(${JSON.stringify({ type: "MOBILE_NAVIGATE", path: targetPath })}, "*");
        true;
      `);

      return cleanup;
    }, [path, stripLocale, i18n.language, currentWebPathRef]),
  );

  // Reload WebView if it's been backgrounded for more than 30 minutes.
  // iOS kills the WKWebView process after extended backgrounding (gray screen);
  // onContentProcessDidTerminate handles that, but this covers both platforms.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundTimeRef.current = Date.now();
      } else if (nextState === "active" && backgroundTimeRef.current !== null) {
        const elapsed = Date.now() - backgroundTimeRef.current;
        backgroundTimeRef.current = null;
        if (elapsed > 30 * 60 * 1000) {
          webviewRef.current?.reload();
        }
      }
    });
    return () => subscription.remove();
  }, []);

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

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload?.type === "LOGIN_SUCCESS") {
        setUserId(payload.userId);
        setJailed(payload.jailed || false);
        markAuthenticated();
      } else if (payload?.type === "LOGOUT") {
        // Grace period: if LOGOUT fires within 5s of the last LOGIN_SUCCESS, it is
        // likely a cookie-sync false alarm — NSHTTPCookieStorage hasn't received
        // the new session cookie from WKHTTPCookieStore yet. Reload the WebView
        // so it retries with the (now-synced) cookie instead of logging out.
        const msSinceLogin = Date.now() - lastLoginTimeRef.current;
        if (msSinceLogin < 5000) {
          // Within grace period after login: likely a cookie-sync false alarm.
          // NSHTTPCookieStorage hasn't received the new session cookie from
          // WKHTTPCookieStore yet. Reload so the WebView retries with the cookie.
          webviewRef.current?.reload();
          return;
        }
        try {
          const res = await client.auth.getAuthState(new Empty());
          if (res.toObject().loggedIn) {
            // Session still valid — false LOGOUT from cookie sync race; reload WebView
            webviewRef.current?.reload();
            return;
          }
        } catch {
          // Can't verify — fall through to logout
        }
        // markLoggedOut is idempotent — safe if multiple tabs call it concurrently.
        // Stack.Protected navigates to login when authenticated becomes false.
        markLoggedOut();
      } else if (payload?.type === "COLOR_SCHEME_CHANGE") {
        // mode can be "light", "dark", or null (follow system)
        const mode = payload.mode;
        if (mode === "light" || mode === "dark" || mode === null) {
          Appearance.setColorScheme(mode);
        }
      } else if (payload?.type === "NATIVE_BACK") {
        if (canGoBackRef.current && webviewRef.current) {
          webviewRef.current.goBack();
        } else {
          // Navigate the WebView back to this tab's root — don't call router.back()
          // which would exit the (tabs) group since detail routes are no longer
          // pushed to the native stack.
          webviewRef.current?.injectJavaScript(`
            window.postMessage(${JSON.stringify({ type: "MOBILE_NAVIGATE", path })}, "*");
            true;
          `);
        }
      } else if (payload?.type === "REQUEST_IMAGE_PICK") {
        // WebView file input crashes on mobile; use native picker instead.
        pickImage(sendImagePickResult);
      }
    } catch (error) {
      // Ignore non-JSON messages from browser/WebView internals.
      if (__DEV__) {
        console.debug("WebEmbed: Ignoring non-JSON message", error);
      }
    }
  };

  const handleShouldStartLoad = (event: { url: string }): boolean => {
    const { url } = event;

    if (shouldLoadInWebView(url, WEB_BASE_URL)) {
      return true;
    }

    // External URLs (Stripe, etc.): open in device's browser.
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

    if (targetUrl.startsWith(WEB_BASE_URL)) {
      webviewRef.current?.injectJavaScript(
        `window.location.href = "${targetUrl}"; true;`,
      );
    } else {
      // External link: open in device's browser.
      Linking.openURL(targetUrl).catch((err) => {
        if (__DEV__) {
          console.error("Failed to open external link:", err);
        }
      });
    }
  };

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
        applicationNameForUserAgent={applicationNameForUserAgent}
        allowsBackForwardNavigationGestures // iOS swipe back/forward
        sharedCookiesEnabled
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT" // Revalidates on normal loads, uses cache for back nav (preserves cookies)
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
        onLoad={() => {
          hasLoadedRef.current = true;
        }}
        onNavigationStateChange={handleNavigationStateChange}
        onContentProcessDidTerminate={() => webviewRef.current?.reload()}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onOpenWindow={handleOpenWindow}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          const isTimeout = nativeEvent.code === -1001;

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
