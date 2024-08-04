import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  useFonts,
  Ubuntu_400Regular,
  Ubuntu_400Regular_Italic,
  Ubuntu_700Bold,
} from "@expo-google-fonts/ubuntu";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import AuthProvider from "features/auth/AuthProvider";

import { useColorScheme } from "@/hooks/useColorScheme";
import { ReactQueryClientProvider } from "@/features/reactQueryClient";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://7de06aa8cca6dacc9620667dd84a0d01@o782870.ingest.us.sentry.io/4507718344704000',

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // enableSpotlight: __DEV__,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Ubuntu_400Regular,
    Ubuntu_400Regular_Italic,
    Ubuntu_700Bold,
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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ReactQueryClientProvider>
        <AuthProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthProvider>
      </ReactQueryClientProvider>
    </ThemeProvider>
  );
}
