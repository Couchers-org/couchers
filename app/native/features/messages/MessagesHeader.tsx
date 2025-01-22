import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { messagesRoute, MessageType } from "@/routes";

import useNotifications from "../useNotifications";
import { ThemedText } from "@/components/ThemedText";
import NotificationBadge from "@/components/NotificationBadge";
import MarkAllReadButton from "@/features/messages/requests/MarkAllReadButton";

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'blue',
  },
});

export function MessagesNotification() {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenMessageCount}>
      <ThemedText>{t("messages_page.tabs.chats")}</ThemedText>
    </NotificationBadge>
  );
}

export function HostRequestsReceivedNotification() {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenReceivedHostRequestCount}>
      <ThemedText>{t("messages_page.tabs.hosting")}</ThemedText>
    </NotificationBadge>
  );
}

export function HostRequestsSentNotification() {
  const { t } = useTranslation(MESSAGES);
  const { data } = useNotifications();

  return (
    <NotificationBadge count={data?.unseenSentHostRequestCount}>
      <ThemedText>{t("messages_page.tabs.surfing")}</ThemedText>
    </NotificationBadge>
  );
}

const labels: Record<MessageType, ReactNode> = {
  chats: <MessagesNotification />,
  hosting: <HostRequestsReceivedNotification />,
  surfing: <HostRequestsSentNotification />,
};

export default function MessagesHeader({
  tab,
}: {
  tab: MessageType | undefined;
}) {
  const { t } = useTranslation(MESSAGES);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{t("messages_page.title")}</ThemedText>
      {tab && <MarkAllReadButton type={tab} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {Object.entries(labels).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.activeTab]}
            onPress={() => router.push(`${messagesRoute}/${key}`)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
          >
            {label}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
