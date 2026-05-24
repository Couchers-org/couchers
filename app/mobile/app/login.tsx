import { useFocusEffect } from "@react-navigation/native";
import { Href, useRouter } from "expo-router";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useCallback, useState } from "react";
import {
  Appearance,
  BackHandler,
  Linking,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { getWebBaseUrl } from "@/config/urls";
import { useAuthContext } from "@/features/auth/AuthContext";
import { loginRoute } from "@/routes";
import client from "@/service/client";
import { lastLoginTimeRef } from "@/state/webViewState";
import { theme } from "@/theme";
import { applicationNameForUserAgent } from "@/utils/userAgent";
import { shouldLoadInWebView } from "@/utils/webViewUrlUtils";

// Polls getAuthState until the session cookie has synced from WKHTTPCookieStore
// to NSHTTPCookieStorage. New WebViews (sharedCookiesEnabled) read from
// NSHTTPCookieStorage, so success here means the dashboard tab will have the cookie.
// iOS's sync is progressively slower after each login/logout cycle, so we use
// 10 attempts. If all fail we proceed anyway — WebEmbed's LOGOUT grace period
// handles any false-alarm logouts from tab WebViews that load before the sync.
async function waitForSessionSync(
  attempts = 10,
  delayMs = 300,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const res = await client.auth.getAuthState(new Empty());
      if (res.toObject().loggedIn) return true;
    } catch {
      // network hiccup — keep retrying
    }
  }
  return false;
}

export default function LoginScreen() {
  const WEB_BASE_URL = getWebBaseUrl();
  const { markAuthenticated, markLoggedOut, setUserId, setJailed } =
    useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [webViewKey, setWebViewKey] = useState<number>(0);

  // Prevent Android back button from navigating away from login screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "LOGIN_SUCCESS") {
        setUserId(data.userId);
        setJailed(data.jailed || false);
        await waitForSessionSync();
        // Proceed regardless of sync result. If the cookie hasn't synced to
        // NSHTTPCookieStorage yet, WebEmbed's LOGOUT grace period will catch
        // any false-alarm LOGOUT messages from tab WebViews.
        lastLoginTimeRef.current = Date.now();
        markAuthenticated();
        router.replace("/(tabs)/dashboard" as Href);
      } else if (data.type === "LOGOUT") {
        // Clear mobile auth state and reset the WebView to drop history
        await markLoggedOut();
        setWebViewKey((k: number): number => k + 1);
      } else if (data.type === "COLOR_SCHEME_CHANGE") {
        const mode = data.mode;
        if (mode === "light" || mode === "dark" || mode === null) {
          Appearance.setColorScheme(mode);
        }
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
        key={webViewKey}
        source={{ uri: WEB_BASE_URL + loginRoute }}
        applicationNameForUserAgent={applicationNameForUserAgent}
        sharedCookiesEnabled
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={(event) => {
          if (shouldLoadInWebView(event.url, WEB_BASE_URL)) {
            return true;
          }
          Linking.openURL(event.url).catch(() => {});
          return false;
        }}
        onOpenWindow={(syntheticEvent) => {
          const { targetUrl } = syntheticEvent.nativeEvent;
          if (!shouldLoadInWebView(targetUrl, WEB_BASE_URL)) {
            Linking.openURL(targetUrl).catch(() => {});
          }
        }}
      />
      {/* TEMPORARY OTA pipeline test marker — remove before merge */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            backgroundColor: "#E4017B",
            color: "#fff",
            fontSize: 16,
            fontWeight: "700",
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          OTA TEST BUNDLE — CI
        </Text>
      </View>
    </SafeAreaView>
  );
}
