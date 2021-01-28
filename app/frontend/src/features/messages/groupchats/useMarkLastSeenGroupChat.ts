import { debounce } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "../../../service";
import { MARK_LAST_SEEN_TIMEOUT } from "../constants";
import { isValidMessageThreadId } from "../utils";

interface MarkLastSeenGroupChatVariables {
  groupChatId: number;
  messageId: number;
}

export default function useMarkLastSeenGroupChat(
  groupChatId: number,
  lastSeenMessageId?: number
) {
  const queryClient = useQueryClient();
  const { mutate: markLastSeenGroupChat } = useMutation<
    Empty,
    Error,
    MarkLastSeenGroupChatVariables
  >(
    ({ groupChatId, messageId }) =>
      service.conversations.markLastSeenGroupChat(groupChatId, messageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["groupChat", groupChatId]);
      },
    }
  );

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

  const debouncedMarkLastSeen = useMemo(
    () =>
      debounce((messageId: number) => {
        markLastSeenGroupChat({ groupChatId, messageId });
      }, MARK_LAST_SEEN_TIMEOUT),
    [groupChatId, markLastSeenGroupChat]
  );

  const markLastSeen = (messageId: number) => {
    if (
      isValidMessageThreadId(groupChatId) &&
      messageId > maxMessageIdRef.current
    ) {
      maxMessageIdRef.current = messageId;
      debouncedMarkLastSeen(messageId);
    }
  };

  return { markLastSeen };
}
