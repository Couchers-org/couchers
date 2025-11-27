import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  useFonts,
  Ubuntu_300Light,
  Ubuntu_300Light_Italic,
  Ubuntu_400Regular,
  Ubuntu_400Regular_Italic,
  Ubuntu_500Medium,
  Ubuntu_500Medium_Italic,
  Ubuntu_700Bold,
  Ubuntu_700Bold_Italic,
} from "@expo-google-fonts/ubuntu";
import * as SplashScreen from "expo-splash-screen";
// import * as Notifications from "expo-notifications";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
// import Sentry from "platform/sentry";

import { Stack } from "expo-router";

import { AuthProvider, useAuthContext } from "@/features/auth/AuthContext";
import { useRegisterPushNotifications } from "@/features/notifications/useRegisterPushNotifications";

// Uncomment to allow notifications to be shown when the app is in the foreground for testing
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// Sentry.init({
//   dsn: "https://7de06aa8cca6dacc9620667dd84a0d01@o782870.ingest.us.sentry.io/4507718344704000",
// });

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

  if (checkedAuthStatus && authenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
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
  useRegisterPushNotifications();
  return null;
}
