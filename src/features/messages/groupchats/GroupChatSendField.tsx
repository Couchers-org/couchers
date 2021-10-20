import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";

import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import useSendFieldStyles from "../useSendFieldStyles";

interface MessageFormData {
  text: string;
}

export interface GroupChatSendFieldProps {
  sendMutation: UseMutationResult<
    string | undefined | Empty,
    GrpcError,
    string
  >;
}

export default function GroupChatSendField({
  sendMutation,
}: GroupChatSendFieldProps) {
  const classes = useSendFieldStyles();

  const { mutate: handleSend, isLoading } = sendMutation;

  const { register, handleSubmit, reset } = useForm<MessageFormData>();
  const onSubmit = handleSubmit(async (data: MessageFormData) => {
    handleSend(data.text.trimRight());
    reset();
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
        defaultValue={""}
        inputRef={register}
        minRows={4}
        maxRows={4}
        multiline
        fullWidth
        onKeyDown={handleKeyDown}
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
