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
import React, { useEffect } from "react";
import "react-native-reanimated";
import AuthProvider from "@/features/auth/AuthProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { ReactQueryClientProvider } from "@/features/reactQueryClient";
// import Sentry from "platform/sentry";

import { Stack } from "expo-router";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { View } from "react-native";
import LoggedOutNavBar from "@/components/navigation/LoggedOutNavBar";

// Sentry.init({
//   dsn: "https://7de06aa8cca6dacc9620667dd84a0d01@o782870.ingest.us.sentry.io/4507718344704000",
// });

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// This is like AppNavigator in the article - conditionally renders based on auth
function RootLayoutNav() {
  const { authState } = useAuthContext();

  // While checking auth status, show nothing (splash screen stays visible)
  if (!authState.authenticated && authState.loading) {
    return null;
  }

  // Conditionally render the appropriate navigator based on auth state
  // This is the key pattern from the article
  if (authState.authenticated) {
    // DashboardNavigator - show the tabs with LoggedInNavBar
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    );
  }

  // AuthNavigator - show login with logged out navbar
  return (
    <View style={{ flex: 1 }}>
      <LoggedOutNavBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Ubuntu_300Light,
    Ubuntu_300Light_Italic,
    Ubuntu_400Regular,
    Ubuntu_400Regular_Italic,
    Ubuntu_500Medium,
    Ubuntu_500Medium_Italic,
    Ubuntu_700Bold,
    Ubuntu_700Bold_Italic,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ReactQueryClientProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ReactQueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
