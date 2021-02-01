import { DialogProps } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import React from "react";
import { useMutation, useQueryClient } from "react-query";

import Alert from "../../../components/Alert";
import Button from "../../../components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "../../../components/Dialog";
import { service } from "../../../service";

export default function MembersDialog({
  groupChatId,
  ...props
}: DialogProps & { groupChatId: number }) {
  const queryClient = useQueryClient();
  const leaveGroupChatMutation = useMutation<Empty, GrpcError, void>(
    () => service.conversations.leaveGroupChat(groupChatId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["groupChatMessages", groupChatId]);
        queryClient.invalidateQueries(["groupChats"]);
        queryClient.invalidateQueries(["groupChat", groupChatId]);
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );
  const handleLeaveGroupChat = () => leaveGroupChatMutation.mutate();

  return (
    <Dialog {...props} aria-labelledby="leave-dialog-title">
      <DialogTitle id="leave-dialog-title">Leave chat?</DialogTitle>
      <DialogContent>
        {leaveGroupChatMutation.error && (
          <Alert severity="error">
            {leaveGroupChatMutation.error?.message}
          </Alert>
        )}
        <DialogContentText>
          Are you sure you want to leave the chat?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleLeaveGroupChat}
          loading={leaveGroupChatMutation.isLoading}
        >
          Yes
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
          loading={leaveGroupChatMutation.isLoading}
        >
          No
        </Button>
      </DialogActions>
    </Dialog>
  );
}
