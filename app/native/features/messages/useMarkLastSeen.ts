import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { useEffect, useRef } from "react";
import { UseMutateFunction } from "react-query";
import { useDebouncedCallback } from 'use-debounce';


import { MARK_LAST_SEEN_TIMEOUT } from "./constants";

export type MarkLastSeenVariables = number;

export default function useMarkLastSeen(
  markLastSeenMutate: UseMutateFunction<Empty, Error, MarkLastSeenVariables>,
  lastSeenMessageId?: number
) {
  const maxMessageIdRef = useRef(0);
  // Sync with latest lastSeenMessageId so anything below that ID doesn't get tried again.
  // Needed since lastSeenMessageId comes from react query which is initially
  // undefined so can't do useRef(lastSeenMessageId).
  useEffect(() => {
    if (lastSeenMessageId) {
      maxMessageIdRef.current = Math.max(
        maxMessageIdRef.current,
        lastSeenMessageId
      );
    }
  }, [lastSeenMessageId]);

  const debouncedMarkLastSeen = useDebouncedCallback(
    (messageId: number) => {
      markLastSeenMutate(messageId);
    },
    MARK_LAST_SEEN_TIMEOUT
  );

  const markLastSeen = (messageId: number) => {
    if (messageId > maxMessageIdRef.current) {
      maxMessageIdRef.current = messageId;
      debouncedMarkLastSeen(messageId);
    }
  };

  return { markLastSeen };
}
