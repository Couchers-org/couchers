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
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import AuthProvider from "features/auth/AuthProvider";

import { useColorScheme } from "@/hooks/useColorScheme";
import { ReactQueryClientProvider } from "@/features/reactQueryClient";
import Sentry from "platform/sentry";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";

Sentry.init({
  dsn: "https://7de06aa8cca6dacc9620667dd84a0d01@o782870.ingest.us.sentry.io/4507718344704000",
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ReactQueryClientProvider>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer screenOptions={{ headerShown: false }}>
              <Drawer.Screen
                name="dashboard"
                options={{ drawerLabel: "Dashboard" }}
              />
              <Drawer.Screen
                name="messages"
                options={{ drawerLabel: "Messages" }}
              />
              <Drawer.Screen
                name="map"
                options={{ drawerLabel: "Map Search" }}
              />
              <Drawer.Screen
                name="events"
                options={{ drawerLabel: "Events" }}
              />
              {/* Divider */}
              <Drawer.Screen
                name="profile"
                options={{ drawerLabel: "Profile" }}
              />
              <Drawer.Screen
                name="account-settings"
                options={{ drawerLabel: "Account Settings" }}
              />
              {/* Divider */}
              {/* <Drawer.Screen
                name="help"
                options={{drawerLabel: 'Help'}}
              /> */}
              <Drawer.Screen
                name="donate"
                options={{ drawerLabel: "Donate" }}
              />
              <Drawer.Screen
                name="volunteer"
                options={{ drawerLabel: "Volunteer" }}
              />
            </Drawer>
          </GestureHandlerRootView>
        </AuthProvider>
      </ReactQueryClientProvider>
    </ThemeProvider>
  );
}
