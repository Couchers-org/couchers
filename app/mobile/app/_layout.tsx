import "react-native-reanimated";
import "@/i18n";

import {
  Ubuntu_300Light,
  Ubuntu_300Light_Italic,
  Ubuntu_400Regular,
  Ubuntu_400Regular_Italic,
  Ubuntu_500Medium,
  Ubuntu_500Medium_Italic,
  Ubuntu_700Bold,
  Ubuntu_700Bold_Italic,
  useFonts,
} from "@expo-google-fonts/ubuntu";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Href, router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import DevSettingsButton from "@/components/DevSettingsButton";
import { hydrateUrlOverrides } from "@/config/urls";
import { AuthProvider, useAuthContext } from "@/features/auth/AuthContext";
import { useRegisterPushNotifications } from "@/features/notifications/useRegisterPushNotifications";
import { reconfigureApiClient } from "@/service/client";
import { getNotificationPath } from "@/utils/getNotificationPath";

const extra = Constants.expoConfig?.extra as
  | { gitHash?: string; appVariant?: string }
  | undefined;
const gitHash = extra?.gitHash ?? "unknown";
const appVariant = extra?.appVariant ?? "unknown";
// The native binary downloaded from the App Store / Play Store. This stays
// fixed across OTA updates, unlike Constants.expoConfig.version which is read
// from the (possibly OTA-updated) JS bundle.
const nativeAppVersion = Application.nativeApplicationVersion ?? "unknown";
const nativeBuildVersion = Application.nativeBuildVersion ?? "unknown";

// Only report from the store-distributed staging and production apps. The dev
// tool (a dev client) and local dev builds would otherwise pollute the project
// with noise from in-progress work.
const sentryEnabled = appVariant === "production" || appVariant === "staging";

if (sentryEnabled) {
  Sentry.init({
    dsn: "https://7de06aa8cca6dacc9620667dd84a0d01@o782870.ingest.us.sentry.io/4507718344704000",

    environment:
      process.env.EXPO_PUBLIC_COUCHERS_ENV ??
      process.env.NEXT_PUBLIC_COUCHERS_ENV ??
      "dev",
    // release/dist are intentionally left unset so the @sentry/react-native
    // Expo integration derives them from the native build and OTA update,
    // matching the values its source-map upload uses. The store-binary and OTA
    // identities below are surfaced as tags/contexts (which don't affect
    // symbolication) for searching and filtering.
    initialScope: {
      tags: {
        appVariant,
        gitHash,
        nativeAppVersion,
        nativeBuildVersion,
        runtimeVersion: Updates.runtimeVersion ?? "unknown",
        updateChannel: Updates.channel ?? "none",
        launchSource: Updates.isEmbeddedLaunch ? "embedded" : "ota",
      },
      contexts: {
        store_build: {
          nativeApplicationVersion: nativeAppVersion,
          nativeBuildVersion,
          gitHash,
        },
        ota: {
          updateId: Updates.updateId ?? "none",
          channel: Updates.channel ?? "none",
          runtimeVersion: Updates.runtimeVersion ?? "unknown",
          isEmbeddedLaunch: Updates.isEmbeddedLaunch,
          createdAt: Updates.createdAt?.toISOString() ?? "unknown",
        },
      },
    },

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Enable Logs
    enableLogs: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
    ],
  });
}

// Module-level Set to track handled notification IDs (persists across component remounts)
const handledNotificationIds = new Set<string>();

const IS_PROD =
  (process.env.NEXT_PUBLIC_COUCHERS_ENV ||
    process.env.EXPO_PUBLIC_COUCHERS_ENV)! === "prod";

if (!IS_PROD) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { authenticated, checkedAuthStatus } = useAuthContext();

  useEffect(() => {
    if (fontsLoaded && checkedAuthStatus) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, checkedAuthStatus]);

  if (!fontsLoaded || !checkedAuthStatus) {
    return null;
  }

  // Using Stack.Protected with guard prop is the recommended Expo Router pattern
  // for auth flows. When the guard condition changes, Expo Router automatically:
  // - Removes screens that are no longer accessible
  // - Resets the navigation state appropriately
  // - Prevents back navigation to screens that shouldn't be accessible
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={authenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!authenticated}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="complete-password-reset" />
      </Stack.Protected>
      {/* Accessible regardless of auth state */}
      <Stack.Screen name="confirm-email" />
      <Stack.Screen name="dev-settings" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Ubuntu_300Light,
    Ubuntu_300Light_Italic,
    Ubuntu_400Regular,
    Ubuntu_400Regular_Italic,
    Ubuntu_500Medium,
    Ubuntu_500Medium_Italic,
    Ubuntu_700Bold,
    Ubuntu_700Bold_Italic,
  });

  // Load any persisted backend URL override and re-point the gRPC client before
  // rendering, so the first auth check and webview loads hit the chosen backend.
  const [configLoaded, setConfigLoaded] = useState(false);
  useEffect(() => {
    hydrateUrlOverrides().then(() => {
      reconfigureApiClient();
      setConfigLoaded(true);
    });
  }, []);

  if (!fontsLoaded || !configLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {/* Set status bar style based on theme: dark icons for light mode, light icons for dark mode */}
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <AuthProvider>
          <PushNotificationsRegistrar />
          <RootNavigator fontsLoaded={fontsLoaded} />
          <DevSettingsButton />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
});

/**
 * Generates a unique ID for a notification response to prevent duplicate handling.
 */
function getNotificationResponseId(
  response: Notifications.NotificationResponse,
): string {
  return response.notification.request.identifier + response.notification.date;
}

/**
 * Handles navigation from a notification response.
 * Uses module-level Set to track handled notifications (persists across remounts).
 */
function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return;
  }

  const responseId = getNotificationResponseId(response);

  // Skip if already handled
  if (handledNotificationIds.has(responseId)) {
    return;
  }
  handledNotificationIds.add(responseId);

  const url = response.notification.request.content.data?.url as
    | string
    | undefined;
  const path = getNotificationPath(url);

  if (path) {
    router.push(path as Href);
  }
}

/**
 * Handles push notification deep linking using Expo's listener-based pattern.
 * - Cold start: getLastNotificationResponse() called once when auth is ready
 * - Foreground/background: addNotificationResponseReceivedListener for interactions
 * @see https://docs.expo.dev/versions/latest/sdk/notifications/#notification-event-listeners
 */
function useNotificationObserver() {
  const { authenticated, checkedAuthStatus } = useAuthContext();

  useEffect(() => {
    // Wait for auth to be checked and user to be authenticated
    if (!checkedAuthStatus || !authenticated) return;

    // Handle cold start: check if app was opened from a notification tap
    const initialResponse = Notifications.getLastNotificationResponse();
    if (initialResponse) {
      handleNotificationResponse(initialResponse);
    }

    // Handle foreground/background: listen for notification interactions
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [authenticated, checkedAuthStatus]);
}

function PushNotificationsRegistrar() {
  useRegisterPushNotifications();
  useNotificationObserver();
  return null;
}
