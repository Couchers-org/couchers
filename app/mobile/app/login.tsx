import { useFocusEffect } from "@react-navigation/native";
import { Href, useRouter } from "expo-router";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useCallback, useState } from "react";
import { Appearance, BackHandler, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { useAuthContext } from "@/features/auth/AuthContext";
import { loginRoute } from "@/routes";
import client from "@/service/client";
import { theme } from "@/theme";
import { applicationNameForUserAgent } from "@/utils/userAgent";

export default function LoginScreen() {
  const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL!;
  const { markAuthenticated, markLoggedOut, setUserId, setJailed } =
    useAuthContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [webViewKey, setWebViewKey] = useState<number>(0);

  // Prevent Android back button from navigating away from login screen
  // This fixes security bypass where users could press back to access authenticated screens
  // Using useFocusEffect ensures the handler is only active when this screen is focused
  // (best practice per React Navigation docs)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back behavior (navigating to previous screen)
        // Users must authenticate to proceed - they can't go back to authenticated screens
        return true;
      };

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
        // Verify auth via the native HTTP client before navigating.
        // The native client uses the shared cookie store — a successful
        // call confirms the cookie has synced and new WebViews will have it.
        const response = await client.auth.getAuthState(new Empty());
        const authState = response.toObject();
        if (authState.loggedIn && authState.authRes) {
          setUserId(authState.authRes.userId);
          setJailed(authState.authRes.jailed);
          markAuthenticated();
          router.replace("/(tabs)/dashboard" as Href);
        }
      } else if (data.type === "LOGOUT") {
        // Clear mobile auth state and reset the WebView to drop history
        await markLoggedOut();
        setWebViewKey((k: number): number => k + 1);
      } else if (data.type === "COLOR_SCHEME_CHANGE") {
        // Web app toggled dark mode - sync native UI
        // mode can be "light", "dark", or null (follow system)
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
      />
    </SafeAreaView>
  );
}
