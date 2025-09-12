import { Tabs } from "expo-router";
import React from "react";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import LoggedInNavBar from "@/components/navigation/LoggedInNavBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <LoggedInNavBar />
      <Tabs
        initialRouteName="dashboard"
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
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
