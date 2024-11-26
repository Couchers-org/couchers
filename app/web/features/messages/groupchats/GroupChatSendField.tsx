import { styled } from "@mui/material";
import Button, { AppButtonProps } from "components/Button";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { usePersistedState } from "platform/usePersistedState";
import React from "react";
import { useForm } from "react-hook-form";
import { UseMutationResult } from "react-query";
import { theme } from "theme";

interface MessageFormData {
  text: string;
}

const StyledButton = styled(Button)<AppButtonProps>({
  display: "block",
  flexShrink: 0,
  marginInlineStart: theme.spacing(1),
  height: theme.spacing(5),
  marginBottom: 0,
  marginTop: "auto",
  alignItems: "center",
});

const StyledForm = styled("form")(({ theme }) => ({
  alignItems: "flex-start",
  display: "flex",
  marginTop: theme.spacing(3),
}));

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
  const { t } = useTranslation([GLOBAL, MESSAGES]);

  const { mutate: handleSend, isLoading } = sendMutation;

  const { register, handleSubmit, reset } = useForm<MessageFormData>();
  const [persistedMessage, setPersistedMessage, clearPersistedMessage] =
    usePersistedState(
      `messages.${currentUserId}.${chatId}`,
      "",
      "sessionStorage"
    );

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
    <StyledForm onSubmit={onSubmit}>
      <TextField
        id="group-chat-message-field"
        label={t("messages:chat_input.label")}
        name="text"
        defaultValue={persistedMessage ?? ""}
        inputRef={register}
        multiline
        fullWidth
        onKeyDown={handleKeyDown}
        onChange={(event) => setPersistedMessage(event.target.value)}
        maxRows={4}
        size="small"
        sx={{ background: theme.palette.common.white }}
      />

      <StyledButton
        type="submit"
        variant="contained"
        color="primary"
        onClick={onSubmit}
        loading={isLoading}
      >
        {t("global:send")}
      </StyledButton>
    </StyledForm>
  );
}
