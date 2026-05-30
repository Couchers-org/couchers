import * as Sentry from "@sentry/react-native";
import * as Clipboard from "expo-clipboard";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";

import { TabBarIcon } from "@/components/TabBarIcon";
import {
  createdAt,
  embeddedDebugVersion,
  isEmbeddedLaunch,
  runningDebugVersionOTA,
  runningDisplayVersion,
  updateChannel,
} from "@/service/buildInfo";
import { dispatchEscapeRef } from "@/state/webViewState";
import { theme } from "@/theme";

// Tapping the Home tab three times in quick succession surfaces a debug toast.
// It reports both bundle identities (see service/buildInfo.ts): the embedded
// store build and the JS bundle currently running, which is how we confirm an
// over-the-air update applied.
const TRIPLE_TAP_WINDOW_MS = 800;

// TEMP (revert before merge): a hand-bumped marker for verifying OTA updates
// on-device. The embedded TestFlight build predates this line, so it appears only
// after an OTA applies; bump it and push to confirm a fresh OTA lands.
const OTA_MARKER = "OTA test #1";

function getDebugInfo(): string {
  return [
    `>>> ${OTA_MARKER} <<<`,
    `Version: ${runningDisplayVersion}`,
    `Running: ${runningDebugVersionOTA}`,
    `Embedded: ${embeddedDebugVersion}`,
    `Source: ${isEmbeddedLaunch ? "embedded build" : "OTA update"}`,
    `Channel: ${updateChannel}`,
    `Published: ${createdAt}`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
  ].join("\n");
}

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

  const tapTimestamps = useRef<number[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debugToast, setDebugToast] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const handleHomeTabPress = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current = [...tapTimestamps.current, now].filter(
      (timestamp) => now - timestamp < TRIPLE_TAP_WINDOW_MS,
    );
    if (tapTimestamps.current.length < 3) return;
    tapTimestamps.current = [];
    const info = getDebugInfo();
    void Clipboard.setStringAsync(info);
    // Confirms the device can reach Sentry; the event also carries the
    // version/OTA/gitHash tags set in the global scope at init.
    Sentry.captureMessage("debug.triple-tap", {
      level: "info",
      contexts: { debug: { info } },
    });
    setDebugToast(`${info}\n\nCopied to clipboard & sent to Sentry`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setDebugToast(null), 6000);
  }, []);

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
    <View style={styles.root}>
      <Tabs
        initialRouteName="dashboard"
        screenListeners={{
          tabPress: () => {
            dispatchEscapeRef.current?.();
          },
        }}
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
          listeners={{ tabPress: handleHomeTabPress }}
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
      {debugToast !== null && (
        <View pointerEvents="none" style={styles.toastContainer}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{debugToast}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toastContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 96,
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 460,
  },
  toastText: {
    color: theme.palette.common.white,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
