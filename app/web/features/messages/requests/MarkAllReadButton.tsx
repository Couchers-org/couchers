import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "components/Button";
import { DoneAllIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import {
  messageFilterToRequest,
  MessageFilterType,
} from "features/messages/constants";
import { messageThreadsListKey, pingQueryKey } from "features/queryKeys";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { service } from "service";

export type MarkAllReadType = Exclude<MessageFilterType, "archived">;

const labelKeyByType: Record<MarkAllReadType, string> = {
  all: "mark_all_read_button_text",
  unread: "mark_all_read_button_text",
  chats: "mark_all_read_button_text_chats",
  hosting: "mark_all_read_button_text_hosting",
  surfing: "mark_all_read_button_text_surfing",
  "public-trips": "mark_all_read_button_text_public_trips",
};

export default function MarkAllReadButton({ type }: { type: MarkAllReadType }) {
  const { t } = useTranslation(MESSAGES);
  const queryClient = useQueryClient();
  const markAll = useMutation({
    mutationFn: () =>
      service.conversations.markAllThreadsSeen(messageFilterToRequest(type)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageThreadsListKey() });
      // Invalidate ping to update badge counts in tabs
      queryClient.invalidateQueries({ queryKey: [pingQueryKey] });
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
        {t(labelKeyByType[type])}
      </Button>
    </>
  );
}
