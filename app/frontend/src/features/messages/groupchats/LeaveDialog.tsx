import Button from "../../../components/Button";
import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  DialogContent,
} from "../../../components/Dialog";
import { DialogProps } from "@material-ui/core";
import { useQueryClient, useMutation } from "react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { service } from "../../../service";
import Alert from "../../../components/Alert";

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
