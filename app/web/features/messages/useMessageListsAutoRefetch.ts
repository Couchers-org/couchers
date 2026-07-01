import { useQueryClient } from "@tanstack/react-query";
import { messageThreadsListKey } from "features/queryKeys";
import useNotifications from "features/useNotifications";
import { useEffect } from "react";

/**
 * Refetches the unified message-threads list whenever any of the unseen counts
 * on the ping query change, so badge counts and list contents stay in sync.
 */
export default function useMessageListsAutoRefetch() {
  const { data: notifications } = useNotifications();
  const queryClient = useQueryClient();
  const unseenMessageCount = notifications?.unseenMessageCount;
  const unseenHostingHostRequestCount =
    notifications?.unseenHostingHostRequestCount;
  const unseenSurfingHostRequestCount =
    notifications?.unseenSurfingHostRequestCount;
  const unseenPublicTripOfferCount = notifications?.unseenPublicTripOfferCount;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: messageThreadsListKey() });
  }, [
    unseenMessageCount,
    unseenHostingHostRequestCount,
    unseenSurfingHostRequestCount,
    unseenPublicTripOfferCount,
    queryClient,
  ]);
}
