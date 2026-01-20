import { styled, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import { DoneAllIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import {
  groupChatsListKey,
  hostRequestsListKey,
  pingQueryKey,
} from "features/queryKeys";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { service } from "service";
import getAllPages from "utils/getAllPages";

const MarkAsReadButtonStyled = styled(Button)(({ theme }) => ({
  border: `1px solid var(--mui-palette-grey-800)`,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  color: "var(--mui-palette-text-primary)",
}));

const MarkAsReadIconStyled = styled(DoneAllIcon)(({ theme }) => ({
  marginInlineEnd: theme.spacing(1),
  fontSize: theme.typography.body1.fontSize,
}));

export default function MarkAllReadButton({
  type,
}: {
  type: "chats" | "hosting" | "surfing";
}) {
  const { t } = useTranslation(MESSAGES);
  const queryClient = useQueryClient();
  const markAll = useMutation({
    mutationFn: async () => {
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
                  chat.latestMessage.messageId,
                )
              : Promise.resolve(),
          ),
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

      <MarkAsReadButtonStyled
        loading={markAll.isPending}
        variant="text"
        onClick={() => markAll.mutate()}
        sx={{ color: "var(--mui-palette-text-primary)" }}
      >
        <MarkAsReadIconStyled />
        <Typography component="span">
          {t(`mark_all_read_button_text_${type}`)}
        </Typography>
      </MarkAsReadButtonStyled>
    </>
  );
}
