import Button from "../../../components/Button";
import React from "react";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
} from "../../../components/Dialog";
import { Checkbox, DialogProps, FormControlLabel } from "@material-ui/core";
import { useForm } from "react-hook-form";
import Alert from "../../../components/Alert";
import { useMutation, useQueryClient } from "react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { service } from "../../../service";
import { GroupChat } from "../../../pb/conversations_pb";
import TextField from "../../../components/TextField";

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
        queryClient.invalidateQueries([
          "groupChatMessages",
          groupChat?.groupChatId,
        ]);
        queryClient.invalidateQueries(["groupChats"]);
        queryClient.invalidateQueries(["groupChat", groupChat.groupChatId]);
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
