import { Tabs } from "expo-router";
import { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";

import { TabBarIcon } from "@/components/TabBarIcon";
import { theme } from "@/theme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();

  // Expo Router caches Tabs.Screen options and doesn't re-read them on re-render.
  // We must manually listen for language changes and force a re-render to update tab labels.
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    i18n.on("languageChanged", forceUpdate);
    return () => {
      i18n.off("languageChanged", forceUpdate);
    };
  }, [i18n]);

  const activeTintColor =
    colorScheme === "dark"
      ? theme.palette.common.white
      : theme.palette.primary.main;

  // Use the same background color as the top bar in WebEmbed
  const backgroundColor =
    colorScheme === "dark"
      ? theme.palette.common.black
      : theme.palette.common.white;

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        tabBarActiveTintColor: activeTintColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor,
          paddingHorizontal: 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          marginHorizontal: -4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          paddingBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.home"),
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
          title: t("tabs.messages"),
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
          title: t("tabs.communities"),
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
          title: t("tabs.search"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "search" : "search-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t("tabs.events"),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
            />
          ),
        }}
      />
      {/* Catch-all and special routes that shouldn't show in tab bar */}
      <Tabs.Screen
        name="md/[...slug]"
        options={{ href: null, animation: "none" }}
      />
      <Tabs.Screen
        name="[...slug]"
        options={{ href: null, animation: "none" }}
      />
    </Tabs>
  );
}
