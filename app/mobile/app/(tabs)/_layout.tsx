import { Tabs, Redirect, router } from "expo-router";

import { theme } from "@/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabBarIcon } from "@/components/TabBarIcon";
import { useAuthContext } from "@/features/auth/AuthProvider";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { authState } = useAuthContext();

  // Redirect to login if not authenticated
  if (!authState.authenticated) {
    router.replace("/login");
    return null;
  }

  return (
    <>
      <Tabs
        initialRouteName="dashboard"
        screenOptions={{
          tabBarActiveTintColor:
            colorScheme === "dark"
              ? theme.palette.common.white
              : theme.palette.primary.main,
          headerShown: false,
        }}
      >
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="account-settings" options={{ href: null }} />
        <Tabs.Screen name="events" options={{ href: null }} />
        <Tabs.Screen name="md/[...slug]" options={{ href: null }} />
        <Tabs.Screen name="[...slug]" options={{ href: null }} />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "chatbubble" : "chatbubble-outline"}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="communities"
          options={{
            title: "Communities",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "people" : "people-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "search" : "search-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
