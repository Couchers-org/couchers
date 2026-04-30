import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import { DoneAllIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import { hasUnreadMessages } from "features/messages/utils";
import {
  groupChatsListKey,
  hostRequestsListKey,
  pingQueryKey,
} from "features/queryKeys";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { service } from "service";
import getAllPages from "utils/getAllPages";

export default function MarkAllReadButton({
  type,
}: {
  type: "chats" | "hosting" | "surfing" | "all";
}) {
  const { t } = useTranslation(MESSAGES);
  const queryClient = useQueryClient();
  const markAll = useMutation({
    mutationFn: async () => {
      const shouldMarkChats = type === "chats" || type === "all";
      const shouldMarkRequests =
        type === "hosting" || type === "surfing" || type === "all";

      if (shouldMarkChats) {
        const data = await getAllPages({
          serviceFunction: service.conversations.listGroupChats,
          listKey: "groupChatsList",
          params: (previousData) => previousData?.lastMessageId,
          hasMore: (previousData) => !previousData.noMore,
        });
        await Promise.all(
          data.map<void>((chat) =>
            hasUnreadMessages(chat)
              ? service.conversations.markLastSeenGroupChat(
                  chat.groupChatId,
                  chat.latestMessage.messageId,
                )
              : Promise.resolve(),
          ),
        );
      }

      if (shouldMarkRequests) {
        const requestType: "all" | "hosting" | "surfing" =
          type === "hosting" || type === "surfing" ? type : "all";
        const data = await getAllPages({
          serviceFunction: service.requests.listHostRequests,
          listKey: "hostRequestsList",
          params: (previousData) => ({
            lastRequestId: previousData?.lastRequestId,
            type: requestType,
          }),
          hasMore: (previousData) => !previousData.noMore,
        });
        await Promise.all(
          data.map<void>((request) =>
            hasUnreadMessages(request)
              ? service.requests.markLastRequestSeen(
                  request.hostRequestId,
                  request.latestMessage.messageId,
                )
              : Promise.resolve(),
          ),
        );
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hostRequestsListKey(),
      });
      queryClient.invalidateQueries({
        queryKey: [groupChatsListKey],
      });
      // Invalidate ping to update badge counts in tabs
      queryClient.invalidateQueries({
        queryKey: [pingQueryKey],
      });
    },
  });

  return (
    <>
      {markAll.error && (
        <Snackbar severity="error">{markAll.error.message}</Snackbar>
      )}

      <Button
        onClick={() => markAll.mutate()}
        loading={markAll.isPending}
        variant="text"
        size="small"
        startIcon={<DoneAllIcon sx={{ fontSize: "0.875rem" }} />}
        sx={{
          textTransform: "none",
          color: "var(--mui-palette-text-secondary)",
          fontSize: "0.875rem",
          paddingX: 1,
          paddingY: 0.5,
          "&:hover": {
            backgroundColor: "var(--mui-palette-action-hover)",
            color: "var(--mui-palette-text-primary)",
          },
        }}
      >
        {type === "all"
          ? t("mark_all_read_button_text")
          : t(`mark_all_read_button_text_${type}`)}
      </Button>
    </>
  );
}
