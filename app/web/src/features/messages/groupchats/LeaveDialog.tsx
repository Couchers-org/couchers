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
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { chatKey, chatMessagesKey, chatsListKey } from "queryKeys";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

export default function MembersDialog({
  chatId,
  ...props
}: DialogProps & { chatId: number }) {
  const queryClient = useQueryClient();
  const leaveChatMutation = useMutation<Empty, GrpcError, void>(
    () => service.conversations.leaveChat(chatId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chatMessagesKey(chatId));
        queryClient.invalidateQueries(chatsListKey);
        queryClient.invalidateQueries(chatKey(chatId));
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );
  const handleLeaveChat = () => leaveChatMutation.mutate();

  return (
    <Dialog {...props} aria-labelledby="leave-dialog-title">
      <DialogTitle id="leave-dialog-title">Leave chat?</DialogTitle>
      <DialogContent>
        {leaveChatMutation.error && (
          <Alert severity="error">{leaveChatMutation.error?.message}</Alert>
        )}
        <DialogContentText>
          Are you sure you want to leave the chat?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLeaveChat} loading={leaveChatMutation.isLoading}>
          Yes
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
          loading={leaveChatMutation.isLoading}
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
}
