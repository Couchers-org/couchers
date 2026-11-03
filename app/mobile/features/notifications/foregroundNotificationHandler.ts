import type { Notification, NotificationBehavior } from "expo-notifications";

import { currentActiveWebPathRef } from "@/state/webViewState";
import { getInAppNotificationPath } from "@/utils/getNotificationPath";
import { stripLocalePrefix } from "@/utils/stripLocalePrefix";

function normalizePath(path: string) {
  return stripLocalePrefix(path.split("?")[0]);
}

function isViewing(currentPath: string, notificationPath: string) {
  const current = normalizePath(currentPath);
  const target = normalizePath(notificationPath);
  // match whole path segments, so /messages/4 doesn't match /messages/42
  return current === target || current.startsWith(`${target}/`);
}

// Suppress foreground notification banners when the user is already viewing
// the relevant content. Badge and notification list always update regardless.
export async function handleForegroundNotification(
  notification: Notification,
): Promise<NotificationBehavior> {
  const url = notification.request.content.data?.url as string | undefined;
  const notificationPath = getInAppNotificationPath(url);
  const currentPath = currentActiveWebPathRef.current;

  const isViewingTarget =
    notificationPath !== null &&
    currentPath !== null &&
    isViewing(currentPath, notificationPath);

  return {
    shouldShowBanner: !isViewingTarget,
    shouldShowList: true,
    shouldPlaySound: !isViewingTarget,
    shouldSetBadge: true,
  };
}
