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
  // unmount (e.g. navigating back before the debounce fires) rather than leave
  // the write sitting in a timer for up to MARK_LAST_SEEN_TIMEOUT.
  const pendingMessageIdRef = useRef<number | null>(null);
  // Sync with latest lastSeenMessageId so anything below that ID doesn't get tried again.
  // Needed since lastSeenMessageId comes from react query which is initially
  // undefined so can't do useRef(lastSeenMessageId).
  useEffect(() => {
    if (lastSeenMessageId) {
      maxMessageIdRef.current = Math.max(maxMessageIdRef.current, lastSeenMessageId);
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

  // Flush any pending mark-seen on unmount so the thread is marked read straight
  // away instead of after the debounce. Callers pass a hook-level onSuccess
  // (useMutation({ onSuccess })), which react-query fires for every mutate call
  // regardless of mount state — only per-call mutate(x, { onSuccess }) callbacks
  // are dropped on unmount — so the list invalidation runs either way.
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
