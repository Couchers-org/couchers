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
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import { Chat } from "proto/conversations_pb";
import { chatKey, chatMessagesKey, chatsListKey } from "queryKeys";
import React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

interface ChatSettingsData {
  title: string;
  onlyAdminsInvite: boolean;
}

export default function ChatSettingsDialog({
  chat,
  ...props
}: DialogProps & { chat: Chat.AsObject }) {
  const { register, handleSubmit } = useForm<ChatSettingsData>();

  const queryClient = useQueryClient();
  const mutation = useMutation<Empty, GrpcError, ChatSettingsData>(
    ({ title, onlyAdminsInvite }) =>
      service.conversations.editChat(chat.chatId, title, onlyAdminsInvite),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chatMessagesKey(chat.chatId));
        queryClient.invalidateQueries(chatsListKey);
        queryClient.invalidateQueries(chatKey(chat.chatId));
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
            defaultValue={chat.title}
            name="title"
            label="Chat title"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="onlyAdminsInvite"
                inputRef={register}
                defaultChecked={chat.onlyAdminsInvite}
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
