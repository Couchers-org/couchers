import { debounce } from "@mui/material";
import { UseMutateFunction } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useEffect, useMemo, useRef } from "react";

import { MARK_LAST_SEEN_TIMEOUT } from "./constants";

export type MarkLastSeenVariables = number;

export default function useMarkLastSeen(
  markLastSeenMutate: UseMutateFunction<Empty, Error, MarkLastSeenVariables>,
  lastSeenMessageId?: number,
) {
  const maxMessageIdRef = useRef(0);
  // Highest id queued in the debounce but not yet sent, so we can flush it on
  // unmount (e.g. navigating back before the debounce fires) — otherwise the
  // mark-seen mutation's onSuccess (which invalidates the message lists) never
  // runs and the list stays showing the thread as unread.
  const pendingMessageIdRef = useRef<number | null>(null);
  // Sync with latest lastSeenMessageId so anything below that ID doesn't get tried again.
  // Needed since lastSeenMessageId comes from react query which is initially
  // undefined so can't do useRef(lastSeenMessageId).
  useEffect(() => {
    if (lastSeenMessageId) {
      maxMessageIdRef.current = Math.max(
        maxMessageIdRef.current,
        lastSeenMessageId,
      );
    }
  }, [lastSeenMessageId]);

  const debouncedMarkLastSeen = useMemo(
    () =>
      debounce((messageId: number) => {
        pendingMessageIdRef.current = null;
        markLastSeenMutate(messageId);
      }, MARK_LAST_SEEN_TIMEOUT),
    [markLastSeenMutate],
  );

  // Flush any pending mark-seen on unmount. This effect is declared after the
  // caller's useMutation, so its cleanup runs first (React runs effect cleanups
  // in reverse order), while that mutation's observer is still subscribed — so
  // its onSuccess (list invalidation) still fires.
  useEffect(
    () => () => {
      debouncedMarkLastSeen.clear();
      if (pendingMessageIdRef.current !== null) {
        markLastSeenMutate(pendingMessageIdRef.current);
        pendingMessageIdRef.current = null;
      }
    },
    [debouncedMarkLastSeen, markLastSeenMutate],
  );

  const markLastSeen = (messageId: number) => {
    if (messageId > maxMessageIdRef.current) {
      maxMessageIdRef.current = messageId;
      pendingMessageIdRef.current = messageId;
      debouncedMarkLastSeen(messageId);
    }
  };

  return { markLastSeen };
}
