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
import * as Notifications from "expo-notifications";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";

import { Stack } from "expo-router";

import { AuthProvider, useAuthContext } from "@/features/auth/AuthContext";
import { useRegisterPushNotifications } from "@/features/notifications/useRegisterPushNotifications";

if (__DEV__) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" redirect={authenticated} />
      <Stack.Screen name="(tabs)" redirect={!authenticated} />
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
