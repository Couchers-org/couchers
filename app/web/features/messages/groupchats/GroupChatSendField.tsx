import Button from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";

import { useSessionStorage } from "../../../features/auth/useAuthStore";
import useSendFieldStyles from "../useSendFieldStyles";

interface MessageFormData {
  text: string;
}

export interface GroupChatSendFieldProps {
  sendMutation: UseMutationResult<string | undefined | Empty, RpcError, string>;
  chatId: number;
  currentUserId: number;
}

export default function GroupChatSendField({
  sendMutation,
  chatId,
  currentUserId,
}: GroupChatSendFieldProps) {
  const classes = useSendFieldStyles();

  const { mutate: handleSend, isLoading } = sendMutation;

  const { register, handleSubmit, reset } = useForm<MessageFormData>();
  const [persistedMessage, setPersistedMessage, clearPersistedMessage] =
    useSessionStorage(`messages.${currentUserId}.${chatId}`, "");

  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text.trimRight());
    clearPersistedMessage();
    reset({ text: "" });
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className={classes.container}>
      <TextField
        id="group-chat-message-field"
        label="Message"
        name="text"
        defaultValue={persistedMessage ?? ''}
        inputRef={register}
        multiline
        fullWidth
        onKeyDown={handleKeyDown}
        onChange={(event) => setPersistedMessage(event.target.value)}
        maxRows={4}
        size="small"
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
        loading={isLoading}
        className={classes.button}
      >
        Send
      </Button>
    </form>
  );
}
