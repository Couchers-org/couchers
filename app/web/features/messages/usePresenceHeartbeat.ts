import { useCallback, useEffect, useRef } from "react";

import { markGroupChatViewing, stopGroupChatViewing } from "service/conversations";

// How often to send presence heartbeats (in ms)
const PRESENCE_HEARTBEAT_INTERVAL = 10000; // 10 seconds

/**
 * Hook to manage presence heartbeats for a group chat.
 * Sends periodic "viewing" signals to suppress notifications while the user
 * is actively viewing a conversation.
 *
 * @param groupChatId - The ID of the group chat being viewed
 * @param enabled - Whether heartbeats should be active (e.g., only when chat is visible)
 */
export default function usePresenceHeartbeat(
  groupChatId: number | undefined,
  enabled: boolean = true,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(false);

  const sendHeartbeat = useCallback(async () => {
    if (!groupChatId) return;
    try {
      await markGroupChatViewing(groupChatId);
    } catch (error) {
      // Silently ignore heartbeat failures - they're not critical
      console.debug("Presence heartbeat failed:", error);
    }
  }, [groupChatId]);

  const stopPresence = useCallback(async () => {
    if (!groupChatId || !isActiveRef.current) return;
    isActiveRef.current = false;
    try {
      await stopGroupChatViewing(groupChatId);
    } catch (error) {
      // Silently ignore stop failures
      console.debug("Stop presence failed:", error);
    }
  }, [groupChatId]);

  useEffect(() => {
    if (!groupChatId || !enabled) {
      // Clear any existing interval and stop presence
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (isActiveRef.current) {
        stopPresence();
      }
      return;
    }

    // Send initial heartbeat
    isActiveRef.current = true;
    sendHeartbeat();

    // Set up interval for subsequent heartbeats
    intervalRef.current = setInterval(sendHeartbeat, PRESENCE_HEARTBEAT_INTERVAL);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Don't call stopPresence here directly as it would create a new promise
      // after cleanup. Instead, the next effect run will handle it.
    };
  }, [groupChatId, enabled, sendHeartbeat, stopPresence]);

  // Handle page visibility changes
  useEffect(() => {
    if (!groupChatId || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop presence
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        stopPresence();
      } else {
        // Page is visible again, restart heartbeats
        isActiveRef.current = true;
        sendHeartbeat();
        intervalRef.current = setInterval(sendHeartbeat, PRESENCE_HEARTBEAT_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [groupChatId, enabled, sendHeartbeat, stopPresence]);

  // Handle component unmount - stop presence
  useEffect(() => {
    return () => {
      if (groupChatId && isActiveRef.current) {
        // Fire and forget - we're unmounting so can't await
        stopGroupChatViewing(groupChatId).catch(() => {});
      }
    };
  }, [groupChatId]);

  return { sendHeartbeat, stopPresence };
}
