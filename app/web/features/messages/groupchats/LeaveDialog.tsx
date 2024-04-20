import { DialogProps } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

export default function LeaveDialog({
  groupChatId,
  ...props
}: DialogProps & { groupChatId: number }) {
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const queryClient = useQueryClient();
  const leaveGroupChatMutation = useMutation<Empty, RpcError, void>(
    () => service.conversations.leaveGroupChat(groupChatId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(groupChatMessagesKey(groupChatId));
        queryClient.invalidateQueries(groupChatsListKey);
        queryClient.invalidateQueries(groupChatKey(groupChatId));
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );
  const handleLeaveGroupChat = () => leaveGroupChatMutation.mutate();

  return (
    <Dialog {...props} aria-labelledby="leave-dialog-title">
      <DialogTitle id="leave-dialog-title">
        {t("messages:leave_chat_dialog.title")}
      </DialogTitle>
      <DialogContent>
        {leaveGroupChatMutation.error && (
          <Alert severity="error">
            {leaveGroupChatMutation.error?.message}
          </Alert>
        )}
        <DialogContentText>
          {t("messages:leave_chat_dialog.message")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleLeaveGroupChat}
          loading={leaveGroupChatMutation.isLoading}
        >
          {t("global:yes")}
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
          loading={leaveGroupChatMutation.isLoading}
        >
          {t("global:no")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
