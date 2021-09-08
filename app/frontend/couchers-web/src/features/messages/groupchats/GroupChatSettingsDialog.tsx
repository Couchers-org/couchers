import { Checkbox, DialogProps, FormControlLabel } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import TextField from "components/TextField";
import { GroupChat } from "couchers-core/src/proto/conversations_pb";
import { service } from "couchers-core/dist/service";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import {
  groupChatKey,
  groupChatMessagesKey,
  groupChatsListKey,
} from "queryKeys";
import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";

interface GroupChatSettingsData {
  title: string;
  onlyAdminsInvite: boolean;
}

export default function GroupChatSettingsDialog({
  groupChat,
  ...props
}: DialogProps & { groupChat: GroupChat.AsObject }) {
  const { register, handleSubmit } = useForm<GroupChatSettingsData>();

  const queryClient = useQueryClient();
  const mutation = useMutation<Empty, GrpcError, GroupChatSettingsData>(
    ({ title, onlyAdminsInvite }) =>
      service.conversations.editGroupChat(
        groupChat.groupChatId,
        title,
        onlyAdminsInvite
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          groupChatMessagesKey(groupChat.groupChatId)
        );
        queryClient.invalidateQueries(groupChatsListKey);
        queryClient.invalidateQueries(groupChatKey(groupChat.groupChatId));
        if (props.onClose) props.onClose({}, "escapeKeyDown");
      },
    }
  );

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <Dialog {...props} aria-labelledby="group-chat-settings-dialog-title">
      <DialogTitle id="group-chat-settings-dialog-title">
        Group chat settings
      </DialogTitle>
      <DialogContent>
        <form onSubmit={onSubmit}>
          {mutation.error && (
            <Alert severity={"error"}>{mutation.error?.message}</Alert>
          )}
          <TextField
            id="group-chat-settings-chat-title"
            inputRef={register}
            defaultValue={groupChat.title}
            name="title"
            label="Chat title"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="onlyAdminsInvite"
                inputRef={register}
                defaultChecked={groupChat.onlyAdminsInvite}
              />
            }
            label="Only admins can invite others to the chat"
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onSubmit} loading={mutation.isLoading}>
          Save
        </Button>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
