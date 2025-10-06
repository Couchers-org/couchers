import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { service } from "@/service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotificationsQueryKey } from "@/features/queryKeys";
import { router } from "expo-router";

export type MobileNotification = {
  notificationId: string;
  title: string;
  body?: string;
  isSeen?: boolean;
  url?: string;
};

type NotificationFeedProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
};

export default function NotificationFeed({
  isOpen,
  onClose,
  onOpenSettings,
}: NotificationFeedProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: [listNotificationsQueryKey],
    queryFn: () =>
      service.notifications.listNotifications({ onlyUnread: false }),
  });

  const notifications: MobileNotification[] = useMemo(
    () =>
      (data?.notificationsList ?? []).map((n) => ({
        notificationId: String(n.notificationId),
        title: n.title ?? "Notification",
        body: n.body ?? "",
        isSeen: n.isSeen ?? false,
        url: (n as any).url ?? (n as any).link ?? "",
      })),
    [data]
  );

  const filtered = useMemo(() => {
    return filter === "unread"
      ? notifications.filter((n) => !n.isSeen)
      : notifications;
  }, [filter, notifications]);

  const latestId = notifications[0]?.notificationId;

  const handleNotificationItemClick = async (
    item: MobileNotification
  ): Promise<void> => {
    onClose();
    await service.notifications.markNotificationSeen(
      Number(item.notificationId),
      true
    );

    // Refresh lists (all + unread)
    queryClient.invalidateQueries({
      queryKey: [listNotificationsQueryKey],
    });
    queryClient.invalidateQueries({
      queryKey: [listNotificationsQueryKey, "unread"],
    });

    // Resolve URL to an in-app /(tabs)/ route and navigate
    let path = item.url || "";
    const base = process.env.EXPO_PUBLIC_WEB_BASE_URL || "";
    if (base && path.startsWith(base)) {
      path = path.slice(base.length);
    } else if (path.startsWith("http")) {
      const u = new URL(path);
      path = `${u.pathname}${u.search || ""}`;
    }

    if (!path) {
      router.push("/(tabs)/dashboard");
      return;
    }

    router.push(`/(tabs)/${encodeURIComponent(path.slice(1))}`);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.panel, { paddingTop: insets.top + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={async () => {
                if (latestId) {
                  await service.notifications.markAllNotificationsSeen(
                    Number(latestId)
                  );
                  queryClient.invalidateQueries({
                    queryKey: [listNotificationsQueryKey],
                  });
                  queryClient.invalidateQueries({
                    queryKey: [listNotificationsQueryKey, "unread"],
                  });
                }
              }}
              hitSlop={8}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Mark all read</Text>
            </Pressable>
            <Pressable
              onPress={onOpenSettings}
              hitSlop={8}
              style={styles.iconBtn}
            >
              <Ionicons name="settings-outline" size={18} color={colors.text} />
            </Pressable>
            <Pressable onPress={onClose} hitSlop={8} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.pillsRow}>
          <Pressable
            onPress={() => setFilter("all")}
            style={[styles.pill, filter === "all" && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                filter === "all" && styles.pillTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("unread")}
            style={[styles.pill, filter === "unread" && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                filter === "unread" && styles.pillTextActive,
              ]}
            >
              Unread
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{String(error.message)}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(n) => n.notificationId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={async () => {
                  await handleNotificationItemClick(item);
                }}
                style={styles.item}
              >
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.body ? (
                    <Text style={styles.itemBody}>{item.body}</Text>
                  ) : null}
                </View>
                {!item.isSeen ? (
                  <View style={styles.unreadDot} />
                ) : (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={colors.icon}
                  />
                )}
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (c: typeof Colors.light) =>
  StyleSheet.create({
    backdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    panel: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: 360,
      backgroundColor: c.background,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: -2, height: 2 },
      elevation: 4,
      paddingHorizontal: 12,
      paddingBottom: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: c.text,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.tabIconSelected,
    },
    headerButtonText: {
      color: c.background,
      fontWeight: "600",
    },
    iconBtn: {
      padding: 6,
    },
    pillsRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
      marginBottom: 8,
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: c.tabIconDefault,
    },
    pillActive: {
      backgroundColor: c.tabIconSelected,
    },
    pillText: {
      color: c.background,
      fontWeight: "600",
    },
    pillTextActive: {
      color: c.background,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorBox: {
      backgroundColor: "#fce4e4",
      borderRadius: 8,
      padding: 10,
    },
    errorText: {
      color: "#b00020",
    },
    listContent: {
      paddingBottom: 24,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.icon,
    },
    itemTextWrap: {
      flex: 1,
      paddingRight: 8,
    },
    itemTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: "600",
    },
    itemBody: {
      color: c.icon,
      fontSize: 13,
      marginTop: 2,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.tint,
    },
  });
