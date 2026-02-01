import {
  ImagePickerResult,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
} from "expo-image-picker";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
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
  const { t, i18n } = useTranslation();
  const { markLoggedOut, setUserId, setJailed, markAuthenticated } =
    useAuthContext();
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // Track the current WebView URL to detect when it drifts from the expected path
  const currentWebPathRef = useRef<string>(path);

  // Handle Android hardware back button - go back in WebView if possible
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return;
      }

      const onBackPress = () => {
        if (canGoBack && webviewRef.current) {
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
    }, [canGoBack]),
  );

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
      // Compare full path including query params to handle search filters
      if (currentWebPathRef.current !== path) {
        const targetUrl = WEB_BASE_URL + path;
        webviewRef.current?.injectJavaScript(
          `window.location.href = "${targetUrl}"; true;`,
        );
        currentWebPathRef.current = path;
      }
    }, [path, WEB_BASE_URL]),
  );

  // Extract locale from web path (e.g., "/de/dashboard" -> "de", "/zh-Hans/search" -> "zh-Hans")
  const extractLocaleFromPath = (webPath: string): string | null => {
    const match = webPath.match(/^\/([a-z]{2}(-[A-Z][a-z]+)?)\//);
    return match ? match[1] : null;
  };

  // Map web paths to native route names
  const getRouteNameForPath = (webPath: string): string | null => {
    // Strip locale prefix if present (e.g., "/de/dashboard" -> "/dashboard")
    const pathWithoutLocale = webPath.replace(
      /^\/[a-z]{2}(-[A-Z][a-z]+)?\//,
      "/",
    );

    // Main tab routes (visible in tab bar)
    if (pathWithoutLocale.startsWith("/dashboard")) return "dashboard";
    if (pathWithoutLocale.startsWith("/messages")) return "messages";
    if (pathWithoutLocale.startsWith("/search")) return "search";
    if (pathWithoutLocale.startsWith("/communities")) return "communities";
    if (pathWithoutLocale.startsWith("/events")) return "events";

    // Special routes
    if (pathWithoutLocale.startsWith("/md/")) return "md/[...slug]";

    // Catch-all for other routes
    if (pathWithoutLocale.startsWith("/")) {
      // Return the slug route for any other path
      return "[...slug]";
    }

    return null;
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url, loading, canGoBack: webViewCanGoBack } = navState;

    // Track whether WebView can go back (for Android back button handling)
    setCanGoBack(webViewCanGoBack);

    if (!url || loading) {
      return;
    }

    const normalizedUrl = url.split("#")[0];

    // Prevent navigation to external sites
    if (!normalizedUrl.startsWith(WEB_BASE_URL)) {
      webviewRef.current?.stopLoading();
      return;
    }

    // Track the current web path (strip query params for tab comparison)
    const webPath: string = normalizedUrl.replace(WEB_BASE_URL, "") || "/";
    const webPathWithoutQuery = webPath.split("?")[0];
    currentWebPathRef.current = webPath;

    // Extract locale from URL and sync with mobile app's i18n
    const webLocale = extractLocaleFromPath(webPathWithoutQuery);
    if (webLocale && webLocale !== i18n.language) {
      i18n.changeLanguage(webLocale).catch((err) => {
        if (__DEV__) {
          console.error("Failed to change mobile app language:", err);
        }
      });
    }

    // Sync native route when WebView navigates to a different page
    const targetRoute = getRouteNameForPath(webPathWithoutQuery);
    const currentRoute = getRouteNameForPath(path);

    // Navigate native router when the route changes
    // Only sync for main tab routes - catch-all routes don't need native navigation
    if (
      targetRoute !== currentRoute &&
      targetRoute &&
      targetRoute !== "[...slug]"
    ) {
      if (targetRoute === "md/[...slug]") {
        // For markdown routes, pass the full path including /md/
        router.navigate(webPathWithoutQuery as Href);
      } else {
        // For main tab routes, preserve query parameters
        // Extract query string from the full web path
        const queryString = webPath.includes("?")
          ? webPath.substring(webPath.indexOf("?"))
          : "";
        router.navigate(`/${targetRoute}${queryString}` as Href);
      }
    }
  };

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

  // Handle image picking from camera or library
  const handleImagePick = async () => {
    // Show action sheet to choose camera or library
    const showPicker = async (source: "camera" | "library") => {
      try {
        let result: ImagePickerResult;

        if (source === "camera") {
          const { status } = await requestCameraPermissionsAsync();
          if (status !== "granted") {
            sendImagePickResult({
              success: false,
              error: t("errors.camera_permission_denied"),
            });
            return;
          }
          result = await launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true, // Get base64 data to send to web app
          });
        } else {
          result = await launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true, // Get base64 data to send to web app
          });
        }

        if (result.canceled) {
          sendImagePickResult({ success: false, canceled: true });
          return;
        }

        const asset = result.assets[0];

        if (!asset.base64) {
          throw new Error("Failed to get image data");
        }

        // Send base64 image back to web app for upload
        const mimeType = asset.mimeType || "image/jpeg";
        sendImagePickResult({
          success: true,
          imageBase64: asset.base64,
          mimeType,
        });
      } catch (error) {
        if (__DEV__) {
          console.error("Image pick error:", error);
        }
        sendImagePickResult({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to pick image",
        });
      }
    };

    // Show platform-specific action sheet
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("common.cancel"),
            t("common.take_photo"),
            t("common.choose_from_library"),
          ],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            showPicker("camera");
          } else if (buttonIndex === 2) {
            showPicker("library");
          } else {
            sendImagePickResult({ success: false, canceled: true });
          }
        },
      );
    } else {
      // Android: use Alert
      Alert.alert(t("common.add_photo"), t("common.choose_photo_source"), [
        {
          text: t("common.cancel"),
          style: "cancel",
          onPress: () =>
            sendImagePickResult({ success: false, canceled: true }),
        },
        { text: t("common.take_photo"), onPress: () => showPicker("camera") },
        {
          text: t("common.choose_from_library"),
          onPress: () => showPicker("library"),
        },
      ]);
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
        router.replace("/login" as Href);
      } else if (payload?.type === "COLOR_SCHEME_CHANGE") {
        // Web app toggled dark mode - sync native UI
        const mode = payload.mode;
        if (mode === "light" || mode === "dark" || mode === null) {
          Appearance.setColorScheme(mode);
        }
      } else if (payload?.type === "REQUEST_IMAGE_PICK") {
        // Web app requests native image picker (WebView file input crashes on mobile)
        handleImagePick();
      }
    } catch (error) {
      // Silently ignore non-JSON messages (expected from browser/WebView internals)
      // These are typically not errors - just messages from the WebView itself
      if (__DEV__) {
        console.debug("WebEmbed: Ignoring non-JSON message", error);
      }
    }
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
        style={styles.webview}
        source={{ uri: WEB_BASE_URL + path }}
        allowsBackForwardNavigationGestures // iOS swipe back/forward
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
        onOpenWindow={handleOpenWindow}
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
