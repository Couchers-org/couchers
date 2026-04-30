import { useQueryClient } from "@tanstack/react-query";
import { groupChatsListKey, hostRequestsListKey } from "features/queryKeys";
import useNotifications from "features/useNotifications";
import { useEffect } from "react";

/**
 * Refetches the group chat and host request lists whenever their corresponding
 * unseen counts on the ping query change, so badge counts and list contents
 * stay in sync.
 */
export default function useMessageListsAutoRefetch() {
  const { data: notifications } = useNotifications();
  const queryClient = useQueryClient();
  const unseenMessageCount = notifications?.unseenMessageCount;
  const unseenReceivedHostRequestCount =
    notifications?.unseenReceivedHostRequestCount;
  const unseenSentHostRequestCount = notifications?.unseenSentHostRequestCount;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: groupChatsListKey() });
  }, [unseenMessageCount, queryClient]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: hostRequestsListKey() });
  }, [unseenReceivedHostRequestCount, unseenSentHostRequestCount, queryClient]);
}
