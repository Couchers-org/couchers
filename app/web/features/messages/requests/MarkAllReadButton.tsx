import { Tooltip } from "@material-ui/core";
import IconButton from "components/IconButton";
import { DoneAllIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import { MARK_ALL_READ } from "features/messages/constants";
import { Error as GrpcError } from "grpc-web";
import { groupChatsListKey, hostRequestsListKey } from "queryKeys";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";
import getAllPages from "utils/getAllPages";

export default function MarkAllReadButton({
  type,
}: {
  type: "chats" | "hosting" | "surfing";
}) {
  const queryClient = useQueryClient();
  const markAll = useMutation<void, GrpcError>(
    async () => {
      if (type === "chats") {
        const data = await getAllPages({
          serviceFunction: service.conversations.listGroupChats,
          listKey: "groupChatsList",
          params: (previousData) => previousData?.lastMessageId,
          hasMore: (previousData) => !previousData.noMore,
        });
        await Promise.all(
          data.map<void>((chat) =>
            chat.latestMessage &&
            chat.lastSeenMessageId < chat.latestMessage.messageId
              ? service.conversations.markLastSeenGroupChat(
                  chat.groupChatId,
                  chat.latestMessage.messageId
                )
              : Promise.resolve()
          )
        );
      } else {
        const data = await getAllPages({
          serviceFunction: service.requests.listHostRequests,
          listKey: "hostRequestsList",
          params: (previousData) => ({
            lastRequestId: previousData?.lastRequestId,
            type,
          }),
          hasMore: (previousData) => !previousData.noMore,
        });
        await Promise.all(
          data.map<void>((request) =>
            request.latestMessage &&
            request.lastSeenMessageId < request.latestMessage.messageId
              ? service.requests.markLastRequestSeen(
                  request.hostRequestId,
                  request.latestMessage.messageId
                )
              : Promise.resolve()
          )
        );
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(hostRequestsListKey());
        queryClient.invalidateQueries(groupChatsListKey);
      },
    }
  );

  return (
    <>
      {markAll.error && (
        <Snackbar severity="error">{markAll.error.message}</Snackbar>
      )}
      <Tooltip title={MARK_ALL_READ}>
        <IconButton
          aria-label={MARK_ALL_READ}
          loading={markAll.isLoading}
          onClick={() => markAll.mutate()}
        >
          <DoneAllIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}
