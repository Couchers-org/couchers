import "react-native-reanimated";

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
import { Href, Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuthContext } from "@/features/auth/AuthContext";
import { useRegisterPushNotifications } from "@/features/notifications/useRegisterPushNotifications";
import { useColorScheme } from "@/hooks/useColorScheme";

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
        <AuthProvider>
          <PushNotificationsRegistrar />
          <RootNavigator fontsLoaded={fontsLoaded} />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function PushNotificationsRegistrar() {
  const router = useRouter();
  useRegisterPushNotifications();

  useEffect(() => {
    // Handle notification taps - navigate to the URL in the notification data
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;

        if (url) {
          try {
            // Extract path from full URL (e.g., "https://couchers.org/messages/" -> "/messages/")
            const path = new URL(url).pathname;
            router.push(`/(tabs)${path}` as Href);
          } catch {
            // If URL parsing fails, use as-is
            router.push(`/(tabs)${url}` as Href);
          }
        }
      },
    );

    return () => subscription.remove();
  }, [router]);

  return null;
}
