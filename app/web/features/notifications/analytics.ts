import { logEvent } from "features/analytics";
import { PingRes } from "proto/api_pb";
import { Notification } from "proto/notifications_pb";
import { useEffect } from "react";

const SUMMARIZED_NOTIFICATIONS = 10;

// Module level so that remounting the navigation doesn't log the same counts again
let lastLoggedBadgeCounts: string | null = null;

export function summarizeNotification(notification: Notification.AsObject) {
  return {
    id: notification.notificationId,
    topic_action: `${notification.topic}:${notification.action}`,
    is_seen: notification.isSeen,
    age_s: notification.created ? Math.round(Date.now() / 1000 - notification.created.seconds) : null,
  };
}

export function summarizeNotifications(notifications: Notification.AsObject[] | undefined) {
  const loaded = notifications ?? [];
  const loadedSeenCount = loaded.filter((notification) => notification.isSeen).length;
  return {
    is_loaded: notifications !== undefined,
    loaded_count: loaded.length,
    loaded_seen_count: loadedSeenCount,
    loaded_unseen_count: loaded.length - loadedSeenCount,
    notifications: loaded.slice(0, SUMMARIZED_NOTIFICATIONS).map(summarizeNotification),
  };
}

export function badgeCounts(pingData: PingRes.AsObject | undefined) {
  if (!pingData) return {};
  return {
    unseen_notification_count: pingData.unseenNotificationCount,
    messages_nav_badge_count:
      pingData.unseenMessageCount + pingData.unseenReceivedHostRequestCount + pingData.unseenSentHostRequestCount,
    unseen_message_count: pingData.unseenMessageCount,
    unseen_received_host_request_count: pingData.unseenReceivedHostRequestCount,
    unseen_sent_host_request_count: pingData.unseenSentHostRequestCount,
    unseen_hosting_host_request_count: pingData.unseenHostingHostRequestCount,
    unseen_surfing_host_request_count: pingData.unseenSurfingHostRequestCount,
    unseen_public_trip_offer_count: pingData.unseenPublicTripOfferCount,
    pending_friend_request_count: pingData.pendingFriendRequestCount,
  };
}

export function useLogNotificationBadgeCount(pingData: PingRes.AsObject | undefined) {
  useEffect(() => {
    if (!pingData) return;
    const counts = badgeCounts(pingData);
    const key = JSON.stringify(counts);
    if (key === lastLoggedBadgeCounts) return;
    lastLoggedBadgeCounts = key;
    logEvent("notifications.badge_count", counts, pingData.unseenNotificationCount);
  }, [pingData]);
}
