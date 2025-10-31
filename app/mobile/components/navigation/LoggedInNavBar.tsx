import React, { useMemo, useState } from "react";
import { Image, StyleSheet, View, Pressable, Modal, Text } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Link, router } from "expo-router";
import NotificationFeed from "@/components/notifications/NotificationFeed";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotificationsQueryKey } from "@/features/queryKeys";
import { service } from "@/service";
import { theme } from "../../theme";

const NavBar = () => {
  const { t } = useTranslation();
  const { authActions, authState } = useAuthContext();

  const [open, setOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].text;
  const styles = useMemo(
    () => createStyles(Colors[colorScheme ?? "light"]),
    [colorScheme]
  );
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: unreadData } = useQuery({
    queryKey: [listNotificationsQueryKey, "unread"],
    queryFn: () =>
      service.notifications.listNotifications({ onlyUnread: true }),
  });
  const unreadCount = unreadData?.notificationsList?.length ?? 0;

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleLogout = async () => {
    setOpen(false);
    setIsNotifOpen(false);
    await authActions.logout();
    queryClient.clear();
    // No need to navigate - RootLayoutNav will automatically show login screen
  };

  if (!authState.authenticated) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/(tabs)/dashboard")}>
          <Image
            source={require("@/assets/images/standard_logo.png")}
            style={styles.logo}
          />
        </Pressable>
        <View style={styles.actions}>
          <Pressable
            onPress={() => setIsNotifOpen(true)}
            style={styles.iconButton}
            hitSlop={8}
          >
            <View style={{ position: "relative" }}>
              <Ionicons
                name="notifications-outline"
                size={32}
                color={iconColor}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 100 ? "100+" : String(unreadCount)}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
          <Pressable
            onPress={handleDrawerOpen}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Ionicons name="menu" size={32} color={iconColor} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={handleDrawerClose}
      >
        <Pressable style={styles.backdrop} onPress={handleDrawerClose} />
        <View style={[styles.drawer, { paddingTop: insets.top + 16 }]}>
          <View style={styles.drawerHeader}>
            <Pressable onPress={handleDrawerClose} hitSlop={8}>
              <Ionicons name="close" size={32} color={iconColor} />
            </Pressable>
          </View>
          <View style={styles.drawerContent}>
            <Link href="/(tabs)/profile" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Profile</Text>
            </Link>
            <Link href="/(tabs)/events" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Events</Text>
            </Link>
            <Link href="/(tabs)/account-settings" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Account Settings</Text>
            </Link>
            <View style={styles.drawerDivider} />
            <Link href="https://help.couchers.org" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Help Center</Text>
            </Link>
            <Link href="/(tabs)/md/donate" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Donate</Text>
            </Link>
            <Link href="/(tabs)/md/volunteer" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Volunteer</Text>
            </Link>
            {/* TODO(NA): add report a problem modal */}
            <Text style={styles.drawerItem}>Report a problem</Text>
            <View style={styles.drawerDivider} />
            <Text style={styles.drawerItem} onPress={handleLogout}>
              Log out
            </Text>
          </View>
        </View>
      </Modal>

      <NotificationFeed
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    safeArea: {
      padding: 8,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    logo: {
      width: 45,
      height: 45,
    },
    iconButton: {
      padding: 8,
    },
    badge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.palette.primary.main,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: colors.background,
      fontSize: 10,
      fontWeight: "700",
    },
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    drawer: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: 280,
      backgroundColor: colors.background,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: -2, height: 2 },
      elevation: 4,
    },
    drawerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    drawerContent: {
      flex: 1,
      gap: 16,
    },
    drawerItem: {
      fontSize: 28,
      fontWeight: "600",
      color: colors.text,
    },
    drawerDivider: {
      height: 1,
      backgroundColor: colors.text,
    },
  });

export default NavBar;
