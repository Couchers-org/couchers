import * as Notifications from "expo-notifications";
import { Href, router } from "expo-router";
import { useEffect } from "react";

import { getNotificationPath } from "@/utils/getNotificationPath";

// Module-level Set to track handled notification IDs (persists across component remounts)
const handledNotificationIds = new Set<string>();

/**
 * Generates a unique ID for a notification response to prevent duplicate handling.
 */
function getNotificationResponseId(
  response: Notifications.NotificationResponse,
): string {
  return response.notification.request.identifier + response.notification.date;
}

/**
 * Handles navigation from a notification response.
 * Uses module-level Set to track handled notifications (persists across remounts).
 */
function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return;
  }

  const responseId = getNotificationResponseId(response);

  // Skip if already handled
  if (handledNotificationIds.has(responseId)) {
    return;
  }
  handledNotificationIds.add(responseId);

  const url = response.notification.request.content.data?.url as
    | string
    | undefined;
  const path = getNotificationPath(url);

  if (path) {
    router.push(path as Href);
  }
}

/**
 * Handles push notification deep linking using Expo's listener-based pattern.
 * - Cold start: getLastNotificationResponse() called once on mount
 * - Foreground/background: addNotificationResponseReceivedListener for interactions
 *
 * Only mount this once the navigator is mounted: Expo Router can't navigate
 * before then, so a cold-start tap would be lost and the app would open on its
 * default tab instead.
 * @see https://docs.expo.dev/versions/latest/sdk/notifications/#notification-event-listeners
 */
export function useNotificationObserver() {
  useEffect(() => {
    // Handle cold start: check if app was opened from a notification tap
    const initialResponse = Notifications.getLastNotificationResponse();
    if (initialResponse) {
      handleNotificationResponse(initialResponse);
    }

    // Handle foreground/background: listen for notification interactions
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
