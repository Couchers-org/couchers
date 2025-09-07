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
import { useAuthContext } from "@/features/auth/AuthProvider";

const NavBar = () => {
  const { t } = useTranslation();
  const { authActions } = useAuthContext();

  const [open, setOpen] = useState(false);
  const colorScheme = useColorScheme();
  const iconColor = Colors[colorScheme ?? "light"].text;
  const styles = useMemo(
    () => createStyles(Colors[colorScheme ?? "light"]),
    [colorScheme]
  );
  const insets = useSafeAreaInsets();

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleLogout = () => {
    authActions.logout();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/(tabs)/dashboard")}>
          <Image
            source={require("@/assets/images/standard_logo.png")}
            style={styles.logo}
          />
        </Pressable>
        <Pressable
          onPress={handleDrawerOpen}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="menu" size={30} color={iconColor} />
        </Pressable>
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
              <Ionicons name="close" size={30} color={iconColor} />
            </Pressable>
          </View>
          <View style={styles.drawerContent}>
            <Link href="/(tabs)/profile" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Profile</Text>
            </Link>
            <Link href="/(tabs)/messages" onPress={handleDrawerClose}>
              <Text style={styles.drawerItem}>Messages</Text>
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
    logo: {
      width: 45,
      height: 45,
    },
    iconButton: {
      padding: 8,
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
