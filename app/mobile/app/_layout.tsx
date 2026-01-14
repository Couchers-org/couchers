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
import * as Notifications from "expo-notifications";
import { Href, router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuthContext } from "@/features/auth/AuthContext";
import { useRegisterPushNotifications } from "@/features/notifications/useRegisterPushNotifications";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getNotificationPath } from "@/utils/getNotificationPath";

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
  // This eliminates the need for manual CommonActions.reset or setTimeout hacks
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={authenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!authenticated}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
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

  if (!fontsLoaded) {
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
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Handles push notification navigation following Expo's recommended pattern.
 * @see https://docs.expo.dev/versions/latest/sdk/notifications/#handle-push-notifications-with-navigation
 */
function useNotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url as string | undefined;
      const path = getNotificationPath(url);
      if (path) {
        router.push(path as Href);
      }
    }

    // Handle cold start: check if app was opened via notification tap
    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    // Handle warm start: listen for notification taps while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      },
    );

    return () => subscription.remove();
  }, []);
}

function PushNotificationsRegistrar() {
  useRegisterPushNotifications();
  useNotificationObserver();
  return null;
}
